const { EventEmitter } = require('events')
const { promisify } = require('util')

// const memoize = require('p-memoize')
// const timeout = require('p-timeout')
const debounce = require('lodash.debounce')
const fromEntries = require('fromentries')

const hyperdrive = require('@geut/hyperdrive-promise')

const DEFAULT_OPTIONS = {
  sparse: false,
  latest: true
}

// const CACHE_MAX_AGE = 1000 * 5
// const TIMEOUT = 1000

// TODO(dk): check support for mounts
// const mounts = await drive.getAllMounts({ memory: true, recursive: !!opts.recursive })

const defaultTransferSizes = {
  downloadedBlocks: 0,
  downloadedBytes: 0
}

/**
 * Drive class
 */
class Drive extends EventEmitter {
  constructor (key, store, transferSizes = defaultTransferSizes, opts = {}) {
    super()

    this._opts = {
      ...DEFAULT_OPTIONS,
      ...opts
    }

    this._hyperdrive = hyperdrive(store, key, this._opts)
    this._key = key
    this._keyString = key.toString('hex')
    this._contentFeed = null

    this._emitDownload = debounce(this._emitDownload.bind(this), 500, { maxWait: 1000 * 2 })

    this._onDownload = this._onDownload.bind(this)
    this._onPeerAdd = debounce(this._onPeerAdd.bind(this), 1000 * 5, { maxWait: 1000 * 10 })
    this._onPeerRemove = debounce(this._onPeerRemove.bind(this), 1000 * 5, { maxWait: 1000 * 10 })
    this._onStats = this._onStats.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onUpload = this._onUpload.bind(this)

    this._loadStats = debounce(this._loadStats.bind(this), 1000, { maxWait: 1000 * 3 })

    this._hyperdrive.on('update', this._onUpdate)
    this._hyperdrive.on('peer-add', this._onPeerAdd)
    this._hyperdrive.on('peer-remove', this._onPeerRemove)

    this._getContentAsync = promisify(this._hyperdrive.getContent)

    // this._memoGetStats = memoize(this._hyperdrive.stats, { cacheKey: () => `stats_${this._keyString}`, maxAge: CACHE_MAX_AGE })
    // this._readFile = memoize(this._hyperdrive.readFile, { cacheKey: () => `readFile_${this._keyString}`, maxAge: CACHE_MAX_AGE })

    this._downloadStarted = false

    this._downloadedBlocks = transferSizes.downloadedBlocks || 0
    this._downloadedBytes = transferSizes.downloadedBytes || 0
  }

  get discoveryKey () {
    return this._hyperdrive.discoveryKey
  }

  get peers () {
    return this._hyperdrive.peers.map(peer => ({
      remoteAddress: peer.remoteAddress,
      ...peer.stats
    }))
  }

  get feedBlocks () {
    return this._contentFeed ? this._contentFeed.length : 0
  }

  get feedBytes () {
    return this._contentFeed ? this._contentFeed.byteLength : 0
  }

  get downloadedBlocks () {
    return this._downloadedBlocks
  }

  get downloadedBytes () {
    return this._downloadedBytes
  }

  // debounced
  _loadStats (path = '/', opts) {
    this._hyperdrive.stats(path, opts, this._onStats)
  }

  async _loadInfo () {
    let indexJSON = {}

    try {
      const raw = await this._hyperdrive.readFile('index.json', 'utf-8')
      indexJSON = JSON.parse(raw)
    } catch (error) {
      console.warn(error, this._keyString, 'INDEX JSON')
    }

    const version = this._hyperdrive.version

    this.emit('info', this._keyString, { info: { version, indexJSON } })
  }

  // Debounced
  _emitDownload () {
    const size = this.getSize()
    this.emit('download', this._keyString, { size })
  }

  _onUpdate () {
    this._loadStats()

    // Size on update after restart seeder is = 0
    // If no download event is triggered after 'update'
    // Size will be showed as 0

    // const size = this.getSize()
    // const seedingStatus = this.getSeedingStatus()

    // this.emit('update', this._keyString, { size, seedingStatus })
  }

  _onDownload (index, { length }) {
    this._downloadedBlocks++
    this._downloadedBytes += length

    const started = this._downloadStarted
    const finished = this.downloadedBlocks >= this.feedBlocks

    if (!started) {
      this._downloadStarted = true
    }

    if (!started || finished) {
      this._loadStats()
      this._loadInfo()

      return this.emit('download', this._keyString, {
        started,
        finished,
        size: this.getSize(),
        seedingStatus: this.getSeedingStatus()
      })
    }

    this._emitDownload()
  }

  _onUpload () {
    this.emit('upload', this._keyString)
  }

  _onPeerAdd () {
    this.emit('peer-add', this._keyString, { peers: this.peers })
  }

  _onPeerRemove () {
    this.emit('peer-remove', this._keyString, { peers: this.peers })
  }

  _onStats (err, stats) {
    if (err) {
      console.warn(err)
      return
    }

    this.emit('stats', this._keyString, { stats: fromEntries(stats) })
  }

  async ready () {
    return this._hyperdrive.ready()
  }

  download (path = '/', cb) {
    return this._hyperdrive.download(path, cb)
  }

  async getContentFeed () {
    if (!this._contentFeed) {
      try {
        this._contentFeed = await this._getContentAsync()
      } catch (error) {
        return null
      }

      this._contentFeed.on('download', this._onDownload)
      this._contentFeed.on('upload', this._onUpload)
      this._contentFeed.on('close', () => {
        this._contentFeed.off('download', this._onDownload)
        this._contentFeed.off('upload', this._onUpload)
      })
    }

    return this._contentFeed
  }

  getSeedingStatus () {
    let status = 'WAITING' // waiting for peers == orange

    if (this.feedBlocks > 0 && this.downloadedBlocks >= this.feedBlocks) {
      status = 'SEEDING' // green
    } else if (this.downloadedBlocks > 0) {
      status = 'DOWNLOADING' // yellow
    }

    return status
  }

  /**
   * Feed size
   */
  getSize () {
    return {
      blocks: this.feedBlocks,
      bytes: this.feedBytes,
      downloadedBlocks: this.downloadedBlocks,
      downloadedBytes: this.downloadedBytes
    }
  }

  async destroy () {
    this._hyperdrive.off('update', this._onUpdate)
    this._hyperdrive.off('peer-add', this._onPeerAdd)
    this._hyperdrive.off('peer-remove', this._onPeerRemove)

    if (this._contentFeed) {
      this._contentFeed.off('download', this._onDownload)
      this._contentFeed.off('upload', this._onUpload)
    }

    await this._hyperdrive.destroyStorage()
  }
}

module.exports = Drive
