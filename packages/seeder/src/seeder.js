const { join } = require('path')
const { EventEmitter } = require('events')
const { homedir } = require('os')
const { encode, decode } = require('dat-encoding')
const crypto = require('hypercore-crypto')
const Hyperdrive = require('@geut/hyperdrive-promise')
const Corestore = require('corestore')
const Networker = require('@corestore/networker')
const raf = require('random-access-file')

const DEFAULT_OPTS = {
  announce: true,
  lookup: false, // https://github.com/hyperswarm/hyperswarm#swarmjointopic-options-onjoin`
  hyperdriveOpts: {
    sparse: false,
    latest: true
  },
  storageLocation: join(homedir(), 'permanent-seeder'),
  corestoreOpts: {
    stats: true,
    sparse: false,
    eagerUpdate: true
  },
  swarmOpts: {
    announceLocalAddress: true,
    maxPeers: 128,
    preferredPort: 49737
  },
  dhtOpts: {}
}

/**
 * getCoreStore.
 *
 * @param {} storageLocation
 * @param {} name
 */
const getCoreStore = (storageLocation, name) => {
  const location = join(storageLocation, name)
  return file => raf(join(location, file))
}

/**
 * Seeder.
 *
 * @extends {EventEmitter}
 */
class Seeder extends EventEmitter {
  /**
   * constructor.
   *
   * @param {} opts
   */
  constructor (opts = {}) {
    super()
    this.opts = { ...DEFAULT_OPTS, ...opts }
    this.drives = new Map()
    this.mirrors = new Map()
    this.unwatches = new Map()
    this.ready = false
  }

  /**
   * init.
   */
  async init () {
    if (this.ready) return

    this.store = new Corestore(
      getCoreStore(this.opts.storageLocation, '.hyper'),
      this.opts.corestoreOpts
    )
    await this.store.ready()

    this.networker = new Networker(this.store)
    this.ready = true
  }

  /**
   * get.
   *
   * @param {} dkey
   */
  get (dkey) {
    return this.drives.get(dkey)
  }

  /**
   * onEvent.
   *
   * @param {} event
   * @param {} args
   */
  onEvent (event, ...args) {
    this.emit(`drive-${event}`, ...args)
  }

  /**
   * seed.
   *
   * @param {} keys
   */
  async seed (keys = []) {
    await this.init()
    for (const key of keys) {
      // get or create hyperdrive
      const keyString = key.toString('hex')

      console.log('SEEDING', keyString)

      let drive = this.drives.get(keyString)
      if (!drive) {
        drive = Hyperdrive(this.store, key, this.hyperdriveOpts)
        this.drives.set(keyString, drive)
      }
      await drive.ready()
      const { discoveryKey } = drive
      // join em all
      await this.networker.configure(discoveryKey, { announce: this.opts.announce, lookup: this.opts.lookup })
      const unmirror = drive.mirror()
      this.mirrors.set(keyString, unmirror)
      const unwatch = drive.watch('/', () => {
        this.onEvent('update')
      })

      const contentFeed = await new Promise((resolve, reject) => {
        drive.getContent((err, cf) => {
          if (err) {
            return reject(err)
          }
          return resolve(cf)
        })
      })

      contentFeed.on('download', (...args) => this.onEvent('download', key, ...args))
      contentFeed.on('upload', (...args) => this.onEvent('upload', key, ...args))
      // TODO(dk): remove listeners

      this.unwatches.set(keyString, unwatch)
    }
  }

  async swarmStats (key) {
    return this.networker.swarm.status(key)
  }

  async allStats () {
    return Promise.all(Array.from(this.drives.keys()).map((driveKey) => this.stat(driveKey)))
  }

  async stat (key) {
    const drive = this.drives.get(key)
    if (!drive) {
      throw new Error('stat: drive not found')
    }

    const network = await this.networker.status(drive.discoveryKey)

    // TODO(dk): check support for mounts
    // const mounts = await drive.getAllMounts({ memory: true, recursive: !!opts.recursive })
    /*
    const getContentFeed = () => {
      const cacheContentKey = drive._contentStates.cache.get(drive.db.feed) || { feed: null }
      return cacheContentKey.feed
    }
    */

    const contentFeed = await new Promise(resolve => {
      drive.getContent((cf) => resolve(cf))
    })

    const stat = {
      content: await getCoreStats(contentFeed),
      metadata: await getCoreStats(drive.metadata),
      network
    }

    return stat

    async function getCoreStats (core) {
      if (!core) return {}
      const stats = core.stats
      const openedPeers = core.peers.filter(p => p.remoteOpened)

      const networkingStats = {
        key: core.key,
        discoveryKey: core.discoveryKey,
        peerCount: core.peers.length,
        peers: openedPeers.map(p => {
          return {
            ...p.stats,
            remoteAddress: p.remoteAddress
          }
        })
      }

      return {
        ...networkingStats,
        uploadedBytes: stats.totals.uploadedBytes || 0,
        uploadedBlocks: stats.totals.uploadedBlocks || 0,
        downloadedBytes: stats.totals.downloadedBytes || 0,
        downloadedBlocks: core.downloaded(),
        totalBlocks: core.length
      }
    }
  }

  /**
   * unseed.
   *
   * @param {string | buffer} key - public key
   */
  async unseed (key) {
    await this.init()
    if (key) {
      const keyString = encode(key)
      const unmirror = this.mirrors.get(keyString)
      await unmirror()
      const unwatch = this.unwatches.get(keyString)
      unwatch.destroy()

      const dkey = crypto.discoveryKey(decode(key))
      return this.networker.configure(dkey, { announce: false, lookup: false })
    }

    await Promise.all(Array.from(this.drives, ([_, drive]) => this.networker.configure(drive.discoveryKey, { announce: false, lookup: false })))
  }

  /**
   * destroy.
   */
  async destroy () {
    await Promise.all(Array.from(this.mirrors, ([_, unmirror]) => unmirror()))
    for (const unmirror of this.unwatches.values()) {
      unmirror.destroy()
    }
    await this.networker.close()
  }
}

module.exports = Seeder
