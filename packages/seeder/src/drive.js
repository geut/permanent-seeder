const { EventEmitter } = require('events')
const { promisify } = require('util')
const memoize = require('p-memoize')
const timeout = require('p-timeout')

const hyperdrive = require('@geut/hyperdrive-promise')

const DEFAULT_OPTIONS = {
  sparse: false,
  latest: true
}

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
    this._store = store
    this._download = null
    this._contentFeed = null

    this._onDownload = this._onDownload.bind(this)
    this._onUpload = this._onUpload.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onPeerAdd = this._onPeerAdd.bind(this)
    this._onPeerRemove = this._onPeerRemove.bind(this)

    this._hyperdrive.on('update', this._onUpdate)
    this._hyperdrive.on('peer-add', this._onPeerAdd)
    this._hyperdrive.on('peer-remove', this._onPeerRemove)

    this._getContentAsync = promisify(this._hyperdrive.getContent)

    this._memoGetStats = memoize(this._hyperdrive.stats, { maxAge: 1000 * 60 * 60 })
    this._memoGetStat = memoize(this._hyperdrive.stat, { maxAge: 1000 * 60 * 60 })
    this._readFile = memoize(this._hyperdrive.readFile, { maxAge: 1000 * 60 * 60 })
  }

  get discoveryKey () {
    return this._hyperdrive.discoveryKey
  }

  get peers () {
    return this._hyperdrive.peers
  }

  download (path, cb) {
    return this._hyperdrive.download(path, cb)
  }

  _onUpdate () {
    this.emit('update')
  }

  _onDownload () {
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

  async ready () {
    return this._hyperdrive.ready()
  }

  async info () {
    // returns drive info, ie: { version, index.json }
    await this.ready()

    let indexJSON = {}

    try {
      const raw = await timeout(this._readFile('index.json', 'utf-8'), 200)
      indexJSON = JSON.parse(raw)
    } catch (err) {
      console.error(err.message)
    }

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

    this._contentFeed.off('download', this._onDownload)
    this._contentFeed.off('upload', this._onUpload)

    await this._hyperdrive.close()
  }

  async getContentFeed () {
    if (!this._contentFeed) {
      this._contentFeed = await this._getContentAsync()

      this._contentFeed.on('download', this._onDownload)
      this._contentFeed.on('upload', this._onUpload)
      this._contentFeed.on('close', () => {
        this._contentFeed.off('download', this._onDownload)
        this._contentFeed.off('upload', this._onUpload)
      })
    }

    return this._contentFeed
  }

  async getStat (path = '/') {
    return this._hyperdrive.stat(path)
  }

  async getStats (path = '/', opts) {
    return timeout(this._memoGetStats(path, opts), 200)
  }

  async getLstat (path = '/') {
    return this._hyperdrive.lstat(path)
  }

  isNumber (value) {
    return Number.isFinite(value)
  }

  async getSize () {
    let stats = new Map()
    try {
      // note: use stats cache
      stats = await this.getStats('/', { file: true })
    } catch (_) {}

    const totalSize = {
      blocks: 0,
      bytes: 0,
      downloadedBlocks: 0
    }

    for (const [filePath, { blocks, size: bytes, downloadedBlocks }] of stats.entries()) {
      const stat = await this._memoGetStat(filePath)

      if (!stat[0].isDirectory()) {
        totalSize.blocks += blocks
        totalSize.bytes += bytes
        totalSize.downloadedBlocks += downloadedBlocks
      }
    }

    totalSize.blocks = this.isNumber(totalSize.blocks) ? totalSize.blocks : 0
    totalSize.bytes = this.isNumber(totalSize.bytes) ? totalSize.bytes : 0
    totalSize.downloadedBlocks = this.isNumber(totalSize.downloadedBlocks) ? totalSize.downloadedBlocks : 0

    return totalSize
  }
}

module.exports = Drive
