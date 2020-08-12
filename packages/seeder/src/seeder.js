const { join } = require('path')
const { promisify } = require('util')
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
    this.stats = new Map()
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
  get (key) {
    return this.drives.get(key)
  }

  /**
   * getSwarmStats
   * @description return some hyperswarm info and currently connected peers
   *
   * @return {{
   *   holepunchable,
   *   remoteAddress,
   *   currentPeers
   * }}
   */
  getSwarmStats () {
    if (!this.ready) return {}

    const holepunchable = this.networker.swarm.holepunchable()
    const ra = this.networker.swarm.remoteAddress()
    const remoteAddress = ra ? `${ra.host}:${ra.port}` : ''
    const currentPeers = this.networker.peers

    return {
      holepunchable,
      remoteAddress,
      currentPeers
    }
  }

  /**
   * onAdd.
   *
   * @description emitted when a new drive is added to the permanent seeder
   * @event
   * @param {string} key - drive key
   */
  onAdd (key) {
    this.emit('add', key)
  }

  /**
   * onWatchUpdate.
   * @description emitted when on drive.watch cb
   * @event
   * @param {string} key - drive key
   */
  onWatchUpdate (key) {
    this.emit('watch-update', key)
  }

  onPeerAdd (...args) {
    this.emit('peer-add', ...args)
  }

  onPeerRemove (...args) {
    this.emit('peer-remove', ...args)
  }

  onDownload (...args) {
    this.emit('download', ...args)
  }

  onUpload (...args) {
    this.emit('upload', ...args)
  }

  onSync (...args) {
    this.emit('sync', ...args)
  }

  _statsToString (stats) {
    const out = {}
    for (const [key, val] of stats.entries()) {
      out[key] = val
    }
    return out
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
      const keyString = encode(key)

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

      if (!this.mirrors.has(keyString)) {
        this.onAdd(keyString)
      }

      this.mirrors.set(keyString, unmirror)
      const unwatch = drive.watch('/', async () => {
        const stats = await drive.stats('/')
        this.stats.set(keyString, this._statsToString(stats))
        this.onWatchUpdate(keyString)
      })

      const getContentFeed = promisify(drive.getContent)
      const contentFeed = await getContentFeed()

      // get stats
      const stats = await drive.stats('/')

      this.stats.set(keyString, this._statsToString(stats))

      // re-emit content feed events
      contentFeed.on('peer-add', (...args) => this.onPeerAdd(keyString, ...args))
      contentFeed.on('peer-remove', (...args) => this.onPeerRemove(keyString, ...args))
      contentFeed.on('download', (...args) => this.onDownload(keyString, ...args))
      contentFeed.on('upload', (...args) => this.onUpload(keyString, ...args))
      contentFeed.on('sync', (...args) => this.onSync(keyString, ...args))
      contentFeed.on('close', () => {
        contentFeed.removeListener('download', this.onDownload)
        contentFeed.removeListener('upload', this.onUpload)
        contentFeed.removeListener('peer-add', this.onPeerAdd)
        contentFeed.removeListener('peer-remove', this.onPeerRemove)
        contentFeed.removeListener('sync', this.onSync)
      })

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
    const drive = this.drives.get(encode(key))

    if (!drive) {
      throw new Error('stat: drive not found')
    }

    const network = await this.networker.status(drive.discoveryKey)

    const driveStat = async (drive) => {
      const statAll = await drive.stat('/')
      const stat = statAll[0]
      delete stat.size // useless size value

      const fileStats = this.stats.get(encode(drive.key))
      console.log({ fileStats })
      const out = {
        ...stat,
        fileStats
      }
      return out
    }

    const getCoreStats = async (core) => {
      if (!core) return {}
      const stats = core.stats
      const openedPeers = core.peers.filter(p => p.remoteOpened)

      const networkingStats = {
        key: encode(core.key),
        discoveryKey: encode(core.discoveryKey),
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
    // TODO(dk): check support for mounts
    // const mounts = await drive.getAllMounts({ memory: true, recursive: !!opts.recursive })

    /*
    const getContentFeed = () => {
      const cacheContentKey = drive._contentStates.cache.get(drive.db.feed) || { feed: null }
      return cacheContentKey.feed
    }
    */
    const getContentFeed = promisify(drive.getContent)
    const contentFeed = await getContentFeed()

    const stat = {
      content: await getCoreStats(contentFeed),
      metadata: await getCoreStats(drive.metadata),
      network,
      drive: await driveStat(drive)
    }

    return stat
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
