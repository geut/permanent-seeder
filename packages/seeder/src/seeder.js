const { EventEmitter } = require('events')
const { homedir } = require('os')
const { join } = require('path')
const { promisify } = require('util')

const { encode, decode } = require('dat-encoding')
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
  storageLocation: join(homedir(), 'permanent-seeder'),
  corestoreOpts: {
    sparse: false,
    cache: {
      data: new HypercoreCache({
        maxByteSize: DATA_CACHE_SIZE,
        estimateSize: val => val.length
      }),
      tree: new HypercoreCache({
        maxByteSize: TREE_CACHE_SIZE,
        estimateSize: val => 40
      })
    },
    ifAvailable: true
  }
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
    this._unlistens = []
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

    this.networker = new Networker(this.store, {
      announceLocalNetwork: true,
      maxPeers: MAX_PEERS,
      ephemeral: false,
      ...this.opts.networker
    })
    await this.networker.listen()

    this.connectivity = promisify(this.networker.swarm.connectivity).bind(this.networker.swarm)

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

    this.networker.on('peer-add', onPeerAdd)
    this.networker.on('peer-remove', onPeerRemove)
    this._unlistens.push(() => {
      this.networker.off('peer-add', onPeerAdd)
      this.networker.off('peer-remove', onPeerRemove)
    })

    this.ready = true
  }

  /**
   * getDrive.
   *
   * @param {string | buffer} key drive key
   */
  getDrive (key) {
    const drive = this.drives.get(encode(key))

    if (!drive) {
      throw new Error(`Drive not found. Key: ${encode(key)}`)
    }

    return drive
  }

  /**
   * Seeds a key
   *
   * @param {string|Buffer} key key to seed
   */
  async seedKey (key) {
    const keyString = encode(key)

    // Check if drive present
    let drive = this.drives.get(keyString)

    // Already downloading
    if (drive) return

    console.log('\n-----------------------------SEEDING------------------------------\n', keyString)
    console.log('------------------------------------------------------------------\n')

    // Create drive
    drive = new Drive(decode(key), this.store)

    // Store drive
    this.drives.set(keyString, drive)

    // Wait for readyness
    await drive.ready()

    drive.download('/')

    const onDriveUpdate = () => {
      this.emit('drive-update', keyString)
    }

    const onDriveDownload = () => {
      this.emit('drive-download', keyString)
    }

    const onDriveDownloadStarted = () => {
      this.emit('drive-download-started', keyString)
    }

    const onDriveDownloadFinished = () => {
      this.emit('drive-download-finished', keyString)
    }

    const onDriveUpload = () => {
      this.emit('drive-upload', keyString)
    }

    const onDrivePeerAdd = () => {
      this.emit('drive-peer-add', keyString)
    }

    const onDrivePeerRemove = () => {
      this.emit('drive-peer-remove', keyString)
    }

    const onDriveStats = (stats) => {
      this.emit('drive-stats', keyString, stats)
    }

    // Register event listeners
    drive.on('download-finished', onDriveDownloadFinished)
    drive.on('download-started', onDriveDownloadStarted)
    drive.on('download', onDriveDownload)
    drive.on('peer-add', onDrivePeerAdd)
    drive.on('peer-remove', onDrivePeerRemove)
    drive.on('stats', onDriveStats)
    drive.on('update', onDriveUpdate)
    drive.on('upload', onDriveUpload)

    this._unlistens.push(() => {
      drive.off('download-finished', onDriveDownloadFinished)
      drive.off('download-started', onDriveDownloadStarted)
      drive.off('download', onDriveDownload)
      drive.off('peer-add', onDrivePeerAdd)
      drive.off('peer-remove', onDrivePeerRemove)
      drive.off('stats', onDriveStats)
      drive.off('update', onDriveUpdate)
      drive.off('upload', onDriveUpload)
    })

    // Notify new drive
    this.emit('drive-add', keyString)

    // Connect to network
    await this.networker.configure(drive.discoveryKey, { announce: this.opts.announce, lookup: this.opts.lookup })

    // Wait for content ready
    await drive.getContentFeed()
  }

  /**
   * Seed multiple keys.
   *
   * @param {} keys
   */
  async seed (keys = []) {
    await this.init()

    await Promise.all(keys.map(this.seedKey.bind(this)))
  }

  driveSize (key) {
    return this.getDrive(key).getSize()
  }

  async driveStats (key) {
    return this.getDrive(key).getStats()
  }

  drivePeers (key) {
    return this.getDrive(key).peers
  }

  async driveInfo (key) {
    return this.getDrive(key).info()
  }

  driveSeedingStatus (key) {
    return this.getDrive(key).seedingStatus()
  }

  loadDriveStats (key) {
    this.getDrive(key).loadStats()
  }

  async driveNetwork (key) {
    const drive = this.getDrive(key)
    return this.networker.status(drive.discoveryKey)
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
  async getSwarmStats () {
    await this.init()

    const { holepunched, bootstrapped } = await this.connectivity()
    const ra = this.networker.swarm.remoteAddress()
    const remoteAddress = ra ? `${ra.host}:${ra.port}` : ''
    const currentPeers = Array
      .from(this.networker.peers.values())
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
      discoveryKeys = this.drives.values().map(drive => drive.discoveryKey)
    }

    await Promise.all(discoveryKeys.map(discoveryKey => this.networker.configure(discoveryKey, { announce: false, lookup: false })))

    this.drives.delete(key)

    this.emit('drive-remove', key)
  }

  /**
   * destroy.
   */
  async destroy () {
    for (const unlisten of this._unlistens) {
      unlisten()
    }
    this._unlistens = []
    // close all drives
    try {
      await Promise.all(Array.from(this.drives.values()).map(drive => drive.destroy()))
    } catch (err) {
      console.warn(err.message)
    }

    if (this.networker) {
      try {
        await this.networker.close()
      } catch (err) {
        console.warn(err.message)
      }
    }
    console.info('Destroy seeder OK')
  }
}

module.exports = Seeder
