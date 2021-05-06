const { EventEmitter } = require('events')
const { promisify } = require('util')

const { decode } = require('dat-encoding')
const debounce = require('lodash.debounce')
const fromEntries = require('fromentries')
const hyperdrive = require('@geut/hyperdrive-promise')

const DEFAULT_OPTIONS = {
  sparse: false,
  latest: true,
  size: {
    downloadedBlocks: 0,
    downloadedBytes: 0
  }
}

// TODO(dk): check support for mounts
// const mounts = await drive.getAllMounts({ memory: true, recursive: !!opts.recursive })

/**
 * Drive class
 */
class Drive extends EventEmitter {
  /**
   * Constructor
   *
   * @param {string} key
   * @param {import('corestore')} store
   * @param {object} opts
   */
  constructor (key, store, opts = {}) {
    super()

    opts = {
      ...DEFAULT_OPTIONS,
      ...opts
    }

    this._hyperdrive = hyperdrive(store, decode(key), opts)
    this._key = key
    this._contentFeed = null

    this._emitDownload = debounce(this._emitDownload.bind(this), 50, { maxWait: 100 * 2, leading: true })

    this._onDownload = this._onDownload.bind(this)
    this._onPeerAdd = debounce(this._onPeerAdd.bind(this), 1000 * 5, { maxWait: 1000 * 10 })
    this._onPeerRemove = debounce(this._onPeerRemove.bind(this), 1000 * 5, { maxWait: 1000 * 10 })
    this._onStats = this._onStats.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onUpload = this._onUpload.bind(this)
    this._logError = this._logError.bind(this)

    this._loadStats = debounce(this._loadStats.bind(this), 100, { maxWait: 100 * 3, leading: true })

    this._hyperdrive.on('update', this._onUpdate)
    this._hyperdrive.on('peer-add', this._onPeerAdd)
    this._hyperdrive.on('peer-remove', this._onPeerRemove)

    this._getContentAsync = promisify(this._hyperdrive.getContent)

    this._downloadStarted = false

    this._downloadedBlocks = opts.size.downloadedBlocks || 0
    this._downloadedBytes = opts.size.downloadedBytes || 0

    this._logger = opts.logger || console
  }

  get discoveryKey () {
    return this._hyperdrive.discoveryKey
  }

  get peers () {
    return this._hyperdrive.peers.map(peer => ({
      remoteAddress: peer.remotePublicKey.toString('hex'),
      ...peer.stats
    }))
  }

  get feedBlocks () {
    return this._contentFeed ? this._contentFeed.length : 0
  }

  get feedBytes () {
    return this._contentFeed ? this._contentFeed.byteLength : 0
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
      this._logger.warn({ error, key: this._key, info: true }, error.message)
    }

    const version = this._hyperdrive.version

    this.emit('info', this._key, { info: { version, indexJSON } })
  }

  resume () {
    if (!this._contentFeed) {
      this._logger.warn({ key: this._key }, 'content feed not available')
      return
    }
    const downloaded = this._downloadedBlocks
    const total = this.feedBlocks

    if (downloaded < total) {
      if (this._contentFeed.downloaded() > this._downloadedBlocks) {
        this._downloadedBlocks = this._contentFeed.downloaded()
      }
      this._logger.info({ key: this._key }, 'Resuming download...')
      this._contentFeed.download()

      this._loadStats()
      this._loadInfo()
      this.emit('download-resume', this._key, {
        size: this.getSize(),
        seedingStatus: this.getSeedingStatus()
      })
    } else if (downloaded > total) {
      // correct values
      this._logger.info({ key: this._key }, 'Adjusting download values')
      this._downloadedBlocks = this.feedBlocks
      this.emit('download-fix', this._key, {
        size: this.getSize()
      })
    }
  }

  // Debounced
  _emitDownload () {
    const size = this.getSize()
    this.emit('download', this._key, { size })
  }

  _onUpdate () {
    this._loadStats()

    // Size on update after restart seeder is = 0
    // If no download event is triggered after 'update'
    // Size will be shown as 0

    // const size = this.getSize()
    // const seedingStatus = this.getSeedingStatus()

    // this.emit('update', this._key, { size, seedingStatus })
  }

  _onDownload (index, { length }) {
    this._downloadedBlocks++
    this._downloadedBytes += length

    const finished = this._downloadedBlocks >= this.feedBlocks
    const started = this._downloadStarted

    if (!started) {
      this._downloadStarted = true
    }

    if (!started || finished) {
      this._loadStats()
      this._loadInfo()

      return this.emit('download', this._key, {
        started: !started && !finished,
        finished,
        size: this.getSize(),
        seedingStatus: this.getSeedingStatus()
      })
    }

    this._emitDownload()
  }

  _onUpload () {
    this.emit('upload', this._key)
  }

  _onPeerAdd () {
    this.emit('peer-add', this._key, { peers: this.peers })
  }

  _onPeerRemove () {
    this.emit('peer-remove', this._key, { peers: this.peers })
  }

  _onStats (error, stats) {
    if (error) {
      this._logger.warn({ error, key: this._key, stats: true }, error.message)
      return
    }

    this.emit('stats', this._key, { stats: fromEntries(stats) })
  }

  _logError (error = {}) {
    this._logger.warn({ key: this._key, error, contentFeed: true }, error.message)
  }

  async ready () {
    return this._hyperdrive.ready()
  }

  download (path = '/', cb) {
    return this._hyperdrive.download(path, cb)
  }

  watch (path = '/', cb) {
    return this._hyperdrive.watch(path, cb)
  }

  async getContentFeed () {
    if (!this._contentFeed) {
      try {
        this._contentFeed = await this._getContentAsync()
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        return null
      }

      this._contentFeed.on('error', this._logError)
      this._contentFeed.on('download', this._onDownload)
      this._contentFeed.on('upload', this._onUpload)
    }

    return this._contentFeed
  }

  getSeedingStatus () {
    let status = 'WAITING' // waiting for peers == orange

    if (this.feedBlocks > 0 && this._downloadedBlocks >= this.feedBlocks) {
      status = 'SEEDING' // green
    } else if (this._downloadedBlocks > 0) {
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
      downloadedBlocks: this._downloadedBlocks,
      downloadedBytes: this._downloadedBytes
    }
  }

  async close () {
    this._hyperdrive.off('update', this._onUpdate)
    this._hyperdrive.off('peer-add', this._onPeerAdd)
    this._hyperdrive.off('peer-remove', this._onPeerRemove)

    if (this._contentFeed) {
      this._contentFeed.off('download', this._onDownload)
      this._contentFeed.off('upload', this._onUpload)
      this._contentFeed.off('error', this._logError)
    }

    try {
      await this._hyperdrive.close()
      this._logger.info({ key: this._key }, 'drive closed OK')
    } catch (err) {
      this._logger.error({ key: this._key, error: err.message }, 'Unable to close drive')
    }
  }

  async destroy () {
    this._hyperdrive.off('update', this._onUpdate)
    this._hyperdrive.off('peer-add', this._onPeerAdd)
    this._hyperdrive.off('peer-remove', this._onPeerRemove)

    if (this._contentFeed) {
      this._contentFeed.off('download', this._onDownload)
      this._contentFeed.off('upload', this._onUpload)
      this._contentFeed.off('error', this._logError)
      try {
        await this._hyperdrive.destroyStorage()
        this._logger.info({ key: this._key }, 'drive destroyed OK')
      } catch (err) {
        this._logger.error({ key: this._key, error: err.message }, 'Unable to destroy drive')
      }
    } else {
      await this._hyperdrive.close()
    }
  }
}

module.exports = Drive
