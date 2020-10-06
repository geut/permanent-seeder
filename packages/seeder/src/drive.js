const { EventEmitter } = require('events')
const { promisify } = require('util')
const memoize = require('p-memoize')
const timeout = require('p-timeout')
const debounce = require('lodash.debounce')

const hyperdrive = require('@geut/hyperdrive-promise')

const DEFAULT_OPTIONS = {
  sparse: false,
  latest: true
}

const CACHE_MAX_AGE = 1000 * 5
const TIMEOUT = 1000

// TODO(dk): check support for mounts
// const mounts = await drive.getAllMounts({ memory: true, recursive: !!opts.recursive })

/**
 * Drive class
 */
class Drive extends EventEmitter {
  constructor (key, store, opts = {}) {
    super()

    this._opts = {
      ...DEFAULT_OPTIONS,
      ...opts
    }

    this._hyperdrive = hyperdrive(store, key, this._opts)
    this._key = key
    this._keyString = key.toString('hex')
    this._store = store
    this._download = null
    this._contentFeed = null

    this._onDownload = debounce(this._onDownload.bind(this), 500, { maxWait: 1000 * 2 })
    this._onUpload = this._onUpload.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onPeerAdd = debounce(this._onPeerAdd.bind(this), 1000 * 5, { maxWait: 1000 * 10 })
    this._onPeerRemove = debounce(this._onPeerRemove.bind(this), 1000 * 5, { maxWait: 1000 * 10 })
    this._onStats = this._onStats.bind(this)

    this._hyperdrive.on('update', this._onUpdate)
    this._hyperdrive.on('peer-add', this._onPeerAdd)
    this._hyperdrive.on('peer-remove', this._onPeerRemove)

    this._getContentAsync = promisify(this._hyperdrive.getContent)

    this._memoGetStats = memoize(this._hyperdrive.stats, { cacheKey: () => `stats_${this._keyString}`, maxAge: CACHE_MAX_AGE })
    this._readFile = memoize(this._hyperdrive.readFile, { cacheKey: () => `readFile_${this._keyString}`, maxAge: CACHE_MAX_AGE })

    this._downloadStarted = false
  }

  get discoveryKey () {
    return this._hyperdrive.discoveryKey
  }

  get peers () {
    return this._hyperdrive.peers
  }

  get feedBlocks () {
    return this._contentFeed ? this._contentFeed.length : 0
  }

  get feedBytes () {
    return this._contentFeed ? this._contentFeed.byteLength : 0
  }

  get feedStats () {
    return this._contentFeed ? this._contentFeed._stats : {}
  }

  _onUpdate () {
    this.emit('update')
  }

  _onDownload () {
    const downloadedPercent = this.feedStats.downloadedBlocks / this.feedBlocks

    // Downloaded > 1%
    if (!this._downloadStarted && downloadedPercent > 0.01) {
      this._downloadStarted = true
      return this.emit('download-started')
    }

    if (this.feedStats.downloadedBlocks >= this.feedBlocks) {
      return this.emit('download-finished')
    }

    this.emit('download')
  }

  _onUpload () {
    this.emit('upload')
  }

  _onPeerAdd () {
    this.emit('peer-add')
  }

  _onPeerRemove () {
    this.emit('peer-remove')
  }

  _onStats (err, stats) {
    if (err) {
      console.error(err)
      return
    }

    this.emit('stats', stats)
  }

  async ready () {
    return this._hyperdrive.ready()
  }

  download (path, cb) {
    return this._hyperdrive.download(path, cb)
  }

  async info () {
    // returns drive info, ie: { version, index.json }
    await this.ready()

    let indexJSON = {}

    try {
      const raw = await timeout(this._readFile('index.json', 'utf-8'), TIMEOUT)
      indexJSON = JSON.parse(raw)
    } catch (_) {}

    const version = this._hyperdrive.version

    return {
      version,
      indexJSON
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

    await this._hyperdrive.close()
  }

  async getContentFeed () {
    if (!this._contentFeed) {
      try {
        this._contentFeed = await this._getContentAsync()
      } catch (error) {
        console.error(error)
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

  loadStats (path = '/', opts) {
    this._hyperdrive.stats(path, opts, this._onStats)
  }

  async getStats (path = '/', opts) {
    try {
      return timeout(this._memoGetStats(path, opts), TIMEOUT)
    } catch (error) {
      console.error(error)
      return new Map()
    }
  }

  seedingStatus () {
    const size = this.getSize()
    let status = 'WAITING' // waiting for peers == orange

    if (this.feedBlocks > 0 && size.downloadedBlocks >= this.feedBlocks) {
      status = 'SEEDING' // green
    } else if (size.downloadedBlocks > 0) {
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
      downloadedBlocks: 0,
      downloadedBytes: 0,
      uploadedBlocks: 0,
      uploadedBytes: 0,
      ...this.feedStats
    }
  }
}

module.exports = Drive
