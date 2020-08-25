const { EventEmitter } = require('events')
const { homedir } = require('os')
const { join } = require('path')

const { encode, decode } = require('dat-encoding')
const Corestore = require('corestore')
const crypto = require('hypercore-crypto')
const Networker = require('@corestore/networker')
const raf = require('random-access-file')

const Drive = require('./drive')

const DEFAULT_OPTS = {
  announce: true,
  lookup: false, // https://github.com/hyperswarm/hyperswarm#swarmjointopic-options-onjoin`
  storageLocation: join(homedir(), 'permanent-seeder'),
  corestoreOpts: {
    stats: true,
    sparse: false,
    eagerUpdate: true
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
   * seed.
   *
   * @param {} keys
   */
  async seed (keys = []) {
    await this.init()

    for (const key of keys) {
      const keyString = encode(key)

      // Check if drive present
      let drive = this.drives.get(keyString)

      // Already downloading
      if (drive) return

      console.log('\n-----------------------------SEEDING------------------------------\n', keyString)
      console.log('------------------------------------------------------------------\n')

      // Create drive
      drive = new Drive(key, this.store)

      // Store drive
      this.drives.set(keyString, drive)

      // Notify new drive
      this.emit('drive-add', keyString)

      // Register event listeners
      drive.on('update', () => this.emit('drive-update', keyString))
      drive.on('download', () => this.emit('drive-download', keyString))
      drive.on('upload', () => this.emit('drive-upload', keyString))
      drive.on('peer-add', () => this.emit('drive-peer-add', keyString))
      drive.on('peer-remove', () => this.emit('drive-peer-remove', keyString))

      // Wait for readyness
      await drive.ready()

      // Connect to network
      if (!this.networker.status(drive.discoveryKey)) {
        await this.networker.configure(drive.discoveryKey, { announce: this.opts.announce, lookup: this.opts.lookup })
      }
    }
  }

  driveSize (key) {
    return this.getDrive(key).size
  }

  driveStats (key) {
    return this.getDrive(key).stats
  }

  driveLstat (key) {
    return this.getDrive(key).lstat
  }

  drivePeers (key) {
    return this.getDrive(key).peers
  }

  async driveNetwork (key) {
    const drive = this.getDrive(key)
    return await this.networker.status(drive.discoveryKey)
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
    await this.networker.close()
  }
}

module.exports = Seeder
