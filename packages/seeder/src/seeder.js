const { join } = require('path')
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

class Seeder {
  constructor (opts = {}) {
    this.opts = { ...DEFAULT_OPTS, ...opts }
    this.drives = new Map()
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

  async seed (keys = []) {
    await this.init()
    for (const key of keys) {
      const drive = Hyperdrive(this.store, key, this.hyperdriveOpts)
      await drive.ready()
      const { discoveryKey } = drive
      this.drives.set(discoveryKey.toString('hex'), drive)
      // join em all
      await this.networker.join(discoveryKey, { announce: this.opts.announce, lookup: this.opts.lookup })
      const handle = drive.download('/')
      await new Promise(resolve => {
        handle.on('finish', async () => {
          const stats = await drive.stats('/')
          console.log({ stats })
          return resolve()
        })
      })
    }
  }

  async unseed (dkey) {
    if (dkey) {
      return this.networker.leave(dkey)
    }

    // note(dk): I think this can be done in parallel with promise.all
    for (const drive of this.drives.values()) {
      await this.networker.leave(drive.discoveryKey)
    }
  }

  async destroy () {
    await this.networker.close()
  }
}

module.exports = Seeder
