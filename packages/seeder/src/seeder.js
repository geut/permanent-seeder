const { join } = require('path')
const { EventEmitter } = require('events')
const { homedir } = require('os')
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
    this.downloads = new Map()
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
    this.emit(`drive-${event}`, { ...args })
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
      const handle = drive.download('/')
      handle.on('finish', (...args) => this.onEvent('finish', key, args))
      handle.on('error', (...args) => this.onEvent('error', key, args))
      this.downloads.set(keyString, handle)
      return this.downloads
    }
  }

  async swarmStats (key) {
    return this.networker.swarm.status(key)
  }

  async allStats () {
    return Promise.all(Array.from(this.drives.keys()).map((driveKey) => this.stat(driveKey)))
  }

  async stat (key, opts = {}) {
    const drive = this.drives.get(key)
    if (!drive) {
      throw new Error('stat: drive not found')
    }

    const network = await this.networker.status(drive.discoveryKey)

    // TODO(dk): check support for mounts
    // const mounts = await drive.getAllMounts({ memory: true, recursive: !!opts.recursive })
    const getContentFeed = () => {
      const cacheContentKey = drive._contentStates.cache.get(drive.db.feed) || { feed: null }
      return cacheContentKey.feed
    }
    const stat = {
      content: await getCoreStats(getContentFeed()),
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
   * @param {} dkey
   */
  async unseed (dkey) {
    await this.init()
    if (dkey) {
      const dwld = this.downloads.get(dkey)
      dwld.destroy()
      return this.networker.configure(dkey, { announce: false, lookup: false })
    }

    await Promise.all(Array.from(this.drives, ([_, drive]) => this.networker.configure(drive.discoveryKey, { announce: false, lookup: true })))
  }

  /**
   * destroy.
   */
  async destroy () {
    for (const handle of this.downloads.values()) {
      handle.destroy()
    }
    await this.networker.close()
  }
}

module.exports = Seeder
