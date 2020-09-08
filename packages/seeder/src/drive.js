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
    this._key = key
    this._store = store
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
    return this._hyperdrive.peers
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

  async getStat (path = '/') {
    return this._hyperdrive.stat(path)
  }

  async getStats (path = '/') {
    return this._hyperdrive.stats(path)
  }

  async getLstat (path = '/') {
    return this._hyperdrive.lstat(path)
  }

  async getSize () {
    const stats = await this.getStats('/', { file: true })

    const totalSize = {
      blocks: 0,
      bytes: 0,
      downloadedBlocks: 0
    }

    for (const [filePath, { blocks, size: bytes, downloadedBlocks }] of stats.entries()) {
      const stat = await this.getStat(filePath)

      if (!stat[0].isDirectory()) {
        totalSize.blocks += blocks
        totalSize.bytes += bytes
        totalSize.downloadedBlocks += downloadedBlocks
      }
    }

    return totalSize
  }
}

module.exports = Drive
