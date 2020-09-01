const { EventEmitter } = require('events')
const { promisify } = require('util')

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
    this._download = null
    this._contentFeed = null
    this._stats = new Map()
    this._lstat = new Map()

    this._onDownload = this._onDownload.bind(this)
    this._onUpload = this._onUpload.bind(this)
    this._onUpdate = this._onUpdate.bind(this)

    this._hyperdrive.on('update', this._onUpdate)

    this._getContentAsync = promisify(this._hyperdrive.getContent)
  }

  get discoveryKey () {
    return this._hyperdrive.discoveryKey
  }

  get stats () {
    return this._stats
  }

  get lstat () {
    return this._lstat
  }

  get peers () {
    return this._contentFeed ? this._contentFeed.peers : []
  }

  get size () {
    const totalSize = Array.from(this.stats.entries()).reduce((all, [fileName, { blocks, size: bytes, downloadedBlocks }]) => {
      all.blocks += blocks
      all.bytes += bytes
      all.downloadedBlocks += downloadedBlocks

      return all
    }, {
      blocks: 0,
      bytes: 0,
      downloadedBlocks: 0
    })

    return totalSize
  }

  async _onUpdate () {
    await this._updateStats()
    await this._updateLstat()
    this.emit('update')
  }

  async _onDownload () {
    await this._updateStats()
    await this._updateLstat()
    this.emit('download')
  }

  async _onUpload () {
    await this._updateStats()
    await this._updateLstat()
    this.emit('upload')
  }

  async _onPeerAdd () {
    this.emit('peer-add')
  }

  async _onPeerRemove () {
    this.emit('peer-remove')
  }

  async _updateStats () {
    this._stats = await this._hyperdrive.stats('/')
  }

  async _updateLstat () {
    this._lstat = await this._hyperdrive.lstat('/')
  }

  async ready () {
    return this._hyperdrive.ready()
  }

  async info () {
    // returns drive info, ie: { version, index.json }
    if (!this._ready) {
      return {}
    }

    let indexJSON = {}

    try {
      indexJSON = JSON.parse(await this._hyperdrive.readFile('index.json', 'utf-8'))
    } catch (_) {}

    const version = this._hyperdrive.version

    return {
      version,
      indexJSON
    }
  }

  async destroy () {
    this._hyperdrive.off('update', this._onUpdate)

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

      await this._updateStats()
      await this._updateLstat()
    }

    return this._contentFeed
  }
}

module.exports = Drive
