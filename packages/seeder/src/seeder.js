const { EventEmitter } = require('events')
const { homedir } = require('os')
const { join } = require('path')
const { promisify } = require('util')

const { decode } = require('dat-encoding')
const Corestore = require('corestore')
const crypto = require('hypercore-crypto')
const HypercoreCache = require('hypercore-cache')
const Networker = require('@corestore/networker')
const raf = require('random-access-file')

const Drive = require('./drive')

const TOTAL_CACHE_SIZE = 1024 * 1024 * 512
const CACHE_RATIO = 0.5
const TREE_CACHE_SIZE = TOTAL_CACHE_SIZE * CACHE_RATIO
const DATA_CACHE_SIZE = TOTAL_CACHE_SIZE * (1 - CACHE_RATIO)
const MAX_PEERS = 256

const DEFAULT_OPTS = {
  announce: true,
  lookup: true,
  storageLocation: join(homedir(), 'permanent-seeder', '.hyper'),
  corestoreOpts: {
    sparse: false,
    sparseMetadata: false,
    cache: {
      data: new HypercoreCache({
        maxByteSize: DATA_CACHE_SIZE,
        estimateSize: val => val.length
      }),
      tree: new HypercoreCache({
        maxByteSize: TREE_CACHE_SIZE,
        estimateSize: val => 40
      })
    }
  }
}

/**
 * getCoreStore.
 *
 * @param {} storageLocation
 * @param {} name
 */
const getCoreStore = (storageLocation) => {
  return file => raf(join(storageLocation, file))
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
    this._opts = { ...DEFAULT_OPTS, ...opts }
    this._drives = new Map()
    this._unlistens = new Map()
    this._ready = false
    this._logger = this._opts.logger || console

    this._onDriveDownload = this._onDriveDownload.bind(this)
    this._onDriveInfo = this._onDriveInfo.bind(this)
    this._onDrivePeerAdd = this._onDrivePeerAdd.bind(this)
    this._onDrivePeerRemove = this._onDrivePeerRemove.bind(this)
    this._onDriveStats = this._onDriveStats.bind(this)
    this._onDriveUpdate = this._onDriveUpdate.bind(this)
    this._onDriveUpload = this._onDriveUpload.bind(this)
  }

  /**
   * Get drive from map
   *
   * @param {string | buffer} key drive key
   */
  _getDrive (key) {
    const drive = this._drives.get(key)

    if (!drive) {
      throw new Error(`Drive not found. Key: ${key}`)
    }

    return drive
  }

  _onDriveDownload (key, data) {
    this.emit('drive-download', key, data)
  }

  _onDriveDownloadResume (key, data) {
    this.emit('drive-download-resume', key, data)
  }

  _onDriveInfo (key, data) {
    this.emit('drive-info', key, data)
  }

  _onDrivePeerAdd (key, data) {
    this.emit('drive-peer-add', key, data)
  }

  _onDrivePeerRemove (key, data) {
    this.emit('drive-peer-remove', key, data)
  }

  _onDriveStats (key, data) {
    this.emit('drive-stats', key, data)
  }

  _onDriveUpdate (key, data) {
    this.emit('drive-update', key, data)
  }

  _onDriveUpload (key) {
    this.emit('drive-upload', key)
  }

  _registerDriveEvents (key, drive) {
    drive.on('download', this._onDriveDownload)
    drive.on('download-resume', this._onDriveDownloadResume)
    drive.on('info', this._onDriveInfo)
    drive.on('peer-add', this._onDrivePeerAdd)
    drive.on('peer-remove', this._onDrivePeerRemove)
    drive.on('stats', this._onDriveStats)
    drive.on('update', this._onDriveUpdate)
    drive.on('upload', this._onDriveUpload)

    this._unlistens.set(key, () => {
      drive.off('download', this._onDriveDownload)
      drive.off('info', this._onDriveInfo)
      drive.off('peer-add', this._onDrivePeerAdd)
      drive.off('peer-remove', this._onDrivePeerRemove)
      drive.off('stats', this._onDriveStats)
      drive.off('update', this._onDriveUpdate)
      drive.off('upload', this._onDriveUpload)
    })
  }

  /**
   * Seeds a key
   *
   * @param {object} keyRecord
   * @param {string} keyRecord.key key to seed
   * @param {object} keyRecord.size current drive sizes
   * @param {number} keyRecord.size.downloadedBlocks downloaded blocks
   * @param {number} keyRecord.size.downloadedBytes downloaded bytes
   */
  async _seedKey ({ key, size }) {
    // Check if drive was already seeded (in-mem)
    let drive = this._drives.get(key)

    // Already downloading
    if (drive) return

    this._logger.info({ key }, 'Seeding key')

    // Create drive
    drive = new Drive(key, this._store, { size, logger: this._logger })

    // Store drive
    this._drives.set(key, drive)

    // Wait for readyness
    await drive.ready()

    // Register event listeners
    this._registerDriveEvents(key, drive)

    // Notify new drive
    this.emit('drive-add', key)

    // Connect to network
    await this._networker.configure(
      drive.discoveryKey,
      { announce: this._opts.announce, lookup: this._opts.lookup }
    )

    drive.download('/')
    // Wait for content ready
    await drive.getContentFeed()

    // Resume Download
    drive.resume()
  }

  /**
   * init.
   */
  async init () {
    if (this._ready) return

    this._store = new Corestore(
      getCoreStore(this._opts.storageLocation),
      this._opts.corestoreOpts
    )

    await this._store.ready()

    this._networker = new Networker(this._store, {
      announceLocalNetwork: true,
      maxPeers: MAX_PEERS,
      ephemeral: false,
      ...this._opts.networker
    })

    await this._networker.listen()

    this._connectivity = promisify(this._networker.swarm.connectivity).bind(this._networker.swarm)

    const onPeerAdd = (peer) => {
      this.emit('networker-peer-add', {
        remoteAddress: peer.remoteAddress,
        type: peer.type,
        bytesSent: peer.stream.bytesSent,
        bytesReceived: peer.stream.bytesReceived
      })
    }

    const onPeerRemove = (peer) => {
      this.emit('networker-peer-remove', {
        remoteAddress: peer.remoteAddress,
        type: peer.type,
        bytesSent: peer.stream.bytesSent,
        bytesReceived: peer.stream.bytesReceived
      })
    }

    this._networker.on('peer-add', onPeerAdd)
    this._networker.on('peer-remove', onPeerRemove)
    this._unlistens.set('init', () => {
      this._networker.off('peer-add', onPeerAdd)
      this._networker.off('peer-remove', onPeerRemove)
    })

    this._ready = true
  }

  /**
   * Seed multiple keys.
   *
   * @param {} keys
   */
  async seed (keys = []) {
    await this.init()

    for (const key of keys) {
      this._seedKey(key).catch(error => this._logger.error({ key, error }, `Seeding error: ${error.message}`))
    }
  }

  drivePeers (key) {
    return this._getDrive(key).peers
  }

  // async driveNetwork (key) {
  //   const drive = this._getDrive(key)
  //   return this._networker.status(drive.discoveryKey)
  // }

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
  async getSwarmStats () {
    await this.init()

    const { holepunched, bootstrapped } = await this._connectivity()
    const ra = this._networker.swarm.remoteAddress()
    const remoteAddress = ra ? `${ra.host}:${ra.port}` : ''
    const currentPeers = Array
      .from(this._networker.peers.values())
      .reduce((acc, curr) => {
        acc.push({
          remoteAddress: curr.remoteAddress,
          type: curr.type,
          bytesSent: curr.stream.bytesSent,
          bytesReceived: curr.stream.bytesReceived
        })
        return acc
      }, [])

    return {
      holepunchable: holepunched,
      bootstrapped,
      remoteAddress,
      currentPeers
    }
  }

  /**
   * unseed.
   *
   * @param {string | buffer} key - public key
   */
  async unseed (key) {
    await this.init()
    let discoveryKeys = []

    if (key) {
      discoveryKeys.push(crypto.discoveryKey(decode(key)))
    } else {
      discoveryKeys = this._drives.values().map(drive => drive.discoveryKey)
    }

    if (this._unlistens.has(key)) {
      const unlisten = this._unlistens.get(key)
      // remove listeners attached to this key/drive
      unlisten()
      this._unlistens.delete(key)
    }

    await Promise.all(discoveryKeys.map(discoveryKey => this._networker.configure(discoveryKey, { announce: false, lookup: false })))

    this._drives.delete(key)

    this.emit('drive-remove', key)
  }

  /**
   * destroy.
   */
  async destroy () {
    for (const unlisten of this._unlistens.values()) {
      unlisten()
    }

    this._unlistens.clear()

    // close all drives
    try {
      await Promise.all(Array.from(this._drives.values()).map(drive => drive.destroy()))
    } catch (error) {
      this._logger.warn({ error })
    }

    if (this._networker) {
      try {
        await this._networker.close()
      } catch (error) {
        this._logger.warn({ error })
      }
    }

    this._logger.info('Destroy seeder OK')
  }
}

module.exports = Seeder
