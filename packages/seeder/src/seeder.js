const { join } = require('path')
const { EventEmitter } = require('events')
const { homedir } = require('os')
const Hyperdrive = require('@geut/hyperdrive-promise')
const Corestore = require('corestore')
const CSN = require('corestore-swarm-networking')
const raf = require('random-access-file')

const DEFAULT_OPTS = {
  announce: true,
  lookup: true,
  hyperdriveOpts: {
    sparse: false,
    latest: true
  },
  storageLocation: join(homedir(), 'permanent-seeder'),
  corestoreOpts: {
    sparse: false,
    eagerUpdate: true
  },
  swarmOpts: {
    announceLocalAddress: true
  },
  dhtOpts: {}
}

const getCoreStore = (storageLocation, name) => {
  const location = join(storageLocation, name)
  return file => raf(join(location, file))
}

class Seeder extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.opts = { ...DEFAULT_OPTS, ...opts }
    this.drives = new Map()
    this.downloads = new Map()
    this.ready = false
  }

  async init () {
    if (this.ready) return

    this.store = new Corestore(
      getCoreStore(this.opts.storageLocation, '.hyper'),
      this.opts.corestoreOpts
    )
    await this.store.ready()

    this.networker = new CSN(this.store, { ...this.opts.swarmOpts })
    this.ready = true
  }

  get (dkey) {
    return this.drives.get(dkey)
  }

  onEvent (event, ...args) {
    this.emit(`drive-${event}`, { ...args })
  }

  async seed (keys = []) {
    await this.init()
    for (const key of keys) {
      // get or create hyperdrive
      const keyString = key.toString('hex')

      console.log('SEEDING', keyString)

      let drive = this.drives.get(keyString)
      if (!drive) {
        drive = Hyperdrive(this.store, key, this.hyperdriveOpts)
        this.drives.set(keyString, drive)
      }
      await drive.ready()
      const { discoveryKey } = drive
      // join em all
      await this.networker.join(discoveryKey, { announce: this.opts.announce, lookup: this.opts.lookup })
      const handle = drive.download('/')
      handle.on('finish', (...args) => this.onEvent('finish', key, args))
      handle.on('error', (...args) => this.onEvent('error', key, args))
      this.downloads.set(keyString, handle)
      return this.downloads
    }
  }

  async unseed (dkey) {
    await this.init()
    if (dkey) {
      const dwld = this.downloads.get(dkey)
      dwld.destroy()
      return this.networker.leave(dkey)
    }

    await Promise.all(Array.from(this.drives, ([_, drive]) => this.networker.leave(drive.discoveryKey)))
  }

  async destroy () {
    for (const handle of this.downloads.values()) {
      handle.destroy()
    }
    await this.networker.close()
  }
}

module.exports = Seeder
