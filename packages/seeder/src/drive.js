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

    this._onDownload = this._onDownload.bind(this)
    this._onUpload = this._onUpload.bind(this)
    this._onUpdate = this._onUpdate.bind(this)

    this._hyperdrive.on('update', this._onUpdate)

    this._getContentAsync = promisify(this._hyperdrive.getContent)
  }

  get discoveryKey () {
    return this._hyperdrive.discoveryKey
  }

  get peers () {
    return this._contentFeed ? this._contentFeed.peers : []
  }

  async _onUpdate () {
    this.emit('update')
  }

  async _onDownload () {
    this.emit('download')
  }

  async _onUpload () {
    this.emit('upload')
  }

  async _onPeerAdd () {
    this.emit('peer-add')
  }

  async _onPeerRemove () {
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
    }

    return this._contentFeed
  }

  async getStats () {
    return this._hyperdrive.stats('/')
  }

  async getLstat () {
    return this._hyperdrive.lstat('/')
  }

  async getSize () {
    const stats = await this.getStats()

    const totalSize = Array.from(stats.entries()).reduce((all, [fileName, { blocks, size: bytes, downloadedBlocks }]) => {
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
}

module.exports = Drive
