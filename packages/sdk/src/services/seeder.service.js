const { resolve } = require('path')

const fromEntries = require('fromentries')

const { Seeder } = require('@geut/permanent-seeder-core')
const { DrivesDatabase } = require('@geut/permanent-seeder-database')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'seeder',

  mixins: [Config],

  dependencies: [
    'keys',
    'metrics'
  ],

  actions: {
    seed: {
      params: {
        keys: { type: 'array', min: 1 }
      },
      async handler (ctx) {
        return this.seed(ctx.params.keys)
      }
    },

    unseed: {
      params: {
        key: { type: 'string', length: '64', hex: true, optional: true }
      },
      async handler (ctx) {
        return this.unseed(ctx.params.key)
      }
    },

    driveInfo: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      async handler (ctx) {
        return this.driveInfo(ctx.params.key)
      }
    },

    driveSize: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      handler (ctx) {
        return this.driveSize(ctx.params.key)
      }
    },

    drivePeers: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      async handler (ctx) {
        return this.drivePeers(ctx.params.key)
      }
    },

    driveStats: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      async handler (ctx) {
        return this.driveStats(ctx.params.key)
      }
    },

    getSwarmStats: {
      async handler () {
        return this.seeder.getSwarmStats()
      }
    }
  },

  methods: {
    async seed (keyBuffers) {
      const keys = keyBuffers.map(key => Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex'))
      return this.seeder.seed(keys)
    },

    async unseed (key) {
      this.logger.info(`Unseed key: ${key}`)
      return this.seeder.unseed(key)
    },

    async driveInfo (key) {
      return this.seeder.driveInfo(key)
    },

    driveSize (key) {
      return this.seeder.driveSize(key)
    },

    async drivePeers (key) {
      let peers = []
      try {
        peers = await this.seeder.drivePeers(key)
      } catch (err) {
        this.logger.error(err)
      }

      return peers.map(peer => ({
        remoteAddress: peer.remoteAddress,
        ...peer.stats
      }))
    },

    async driveStats (key) {
      let stats = new Map()
      try {
        stats = await this.seeder.driveStats(key)
      } catch (err) {
        this.logger.error(err)
      }
      return fromEntries(stats)
    },

    async loadDriveStats (key) {
      this.seeder.loadDriveStats(key)
    },

    driveSeedingStatus (key) {
      return this.seeder.driveSeedingStatus(key)
    },

    async updateDriveData (
      key,
      {
        info = false,
        peers = false,
        seedingStatus = false,
        size = false,
        stats = false
      } = {},
      data
    ) {
      const toUpdate = {}

      if (info) toUpdate.info = await this.driveInfo(key)
      if (peers) toUpdate.peers = await this.drivePeers(key)
      if (seedingStatus) toUpdate.seedingStatus = this.driveSeedingStatus(key)
      if (size) toUpdate.size = this.driveSize(key)

      await this.database.update(key, {
        ...data,
        ...toUpdate
      })
    },

    async onDriveAdd (key) {
      const dbDrive = await this.database.get(key)

      if (!dbDrive) {
        await this.database.add({ key })
      }

      this.broker.broadcast('seeder.drive.add', { key })
    },

    async onDriveRemove (key) {
      await this.database.remove(key)
      this.broker.broadcast('seeder.drive.remove', { key })
    },

    async onDriveUpdate (key) {
      // Request for stats => onDriveStats
      this.loadDriveStats(key)

      await this.updateDriveData(key, { size: true, seedingStatus: true })
      this.broker.broadcast('seeder.drive.update', { key })
    },

    async onDriveDownloadStarted (key) {
      // Request for stats => onDriveStats
      this.loadDriveStats(key)

      await this.updateDriveData(key, { info: true, size: true, seedingStatus: true })
      this.broker.broadcast('seeder.drive.download-started', { key })
    },

    async onDriveDownload (key) {
      await this.updateDriveData(key, { size: true })
      this.broker.broadcast('seeder.drive.download', { key })
    },

    async onDriveDownloadFinished (key) {
      // Request for stats => onDriveStats
      this.loadDriveStats(key)

      await this.updateDriveData(key, { size: true, seedingStatus: true })
      this.broker.broadcast('seeder.drive.download-finished', { key })
    },

    async onDriveUpload (key) {
      await this.updateDriveData(key, { size: true })
      this.broker.broadcast('seeder.drive.upload', { key })
    },

    async onDrivePeerAdd (key) {
      await this.updateDriveData(key, { peers: true })
      this.broker.broadcast('seeder.drive.peer.add', { key })
    },

    async onDrivePeerRemove (key) {
      await this.updateDriveData(key, { peers: true })
      this.broker.broadcast('seeder.drive.peer.remove', { key })
    },

    async onDriveStats (key, stats) {
      await this.updateDriveData(key, undefined, { stats: fromEntries(stats) })
      this.broker.broadcast('seeder.drive.stats', { key })
    },

    onSwarmPeerAdd (peer) {
      this.broker.broadcast('seeder.networker.peer.add', { peer })
    },

    onSwarmPeerRemove (peer) {
      this.broker.broadcast('seeder.networker.peer.remove', { peer })
    }
  },

  created () {
    const networker = {
      preferredPort: this.settings.config.swarm_port
    }

    this.seeder = new Seeder({
      storageLocation: resolve(this.settings.config.path, '.hyper'),
      networker
    })

    const drivesDbPath = resolve(this.settings.config.path, 'drives.db')

    this.database = new DrivesDatabase(drivesDbPath)
  },

  async started () {
    await this.seeder.init()

    const keys = await this.broker.call('keys.getAll')

    this.seeder.on('drive-add', this.onDriveAdd)
    this.seeder.on('drive-update', this.onDriveUpdate)
    this.seeder.on('drive-remove', this.onDriveRemove)
    this.seeder.on('drive-download', this.onDriveDownload)
    this.seeder.on('drive-download-started', this.onDriveDownloadStarted)
    this.seeder.on('drive-download-finished', this.onDriveDownloadFinished)
    this.seeder.on('drive-upload', this.onDriveUpload)
    this.seeder.on('drive-peer-add', this.onDrivePeerAdd)
    this.seeder.on('drive-peer-remove', this.onDrivePeerRemove)
    this.seeder.on('drive-stats', this.onDriveStats)
    this.seeder.on('networker-peer-add', this.onSwarmPeerAdd)
    this.seeder.on('networker-peer-remove', this.onSwarmPeerRemove)

    this.seed(keys.map(({ key }) => key))
  },

  async stopped () {
    // remove listeners
    this.seeder.off('drive-add', this.onDriveAdd)
    this.seeder.off('drive-update', this.onDriveUpdate)
    this.seeder.off('drive-remove', this.onDriveRemove)
    this.seeder.off('drive-download', this.onDriveDownload)
    this.seeder.off('drive-download-started', this.onDriveDownloadStarted)
    this.seeder.off('drive-download-finished', this.onDriveDownloadFinished)
    this.seeder.off('drive-upload', this.onDriveUpload)
    this.seeder.off('drive-peer-add', this.onDrivePeerAdd)
    this.seeder.off('drive-peer-remove', this.onDrivePeerRemove)
    this.seeder.off('drive-stats', this.onDriveStats)
    this.seeder.off('networker-peer-add', this.onSwarmPeerAdd)
    this.seeder.off('networker-peer-remove', this.onSwarmPeerRemove)

    return this.seeder.destroy()
  }

}
