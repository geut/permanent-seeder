const { resolve } = require('path')

const { Seeder } = require('@geut/permanent-seeder-core')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'seeder',

  mixins: [Config],

  dependencies: [
    'keys'
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
      async handler (ctx) {
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

    async driveSize (key) {
      let size = {}
      try {
        size = await this.seeder.driveSize(key)
      } catch (err) {
        this.logger.error(err)
      }
      return size
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
      return Object.fromEntries(stats)
    },

    onDriveAdd (key) {
      this.broker.broadcast('seeder.drive.add', { key })
    },

    onDriveUpdate (key) {
      this.broker.broadcast('seeder.drive.update', { key })
    },

    onDriveRemove (key) {
      this.broker.broadcast('seeder.drive.remove', { key })
    },

    onDriveDownload (key) {
      this.broker.broadcast('seeder.drive.download', { key })
    },

    onDriveUpload (key) {
      this.broker.broadcast('seeder.drive.upload', { key })
    },

    onDrivePeerAdd (key) {
      this.broker.broadcast('seeder.drive.peer.add', { key })
    },

    onDrivePeerRemove (key) {
      this.broker.broadcast('seeder.drive.peer.remove', { key })
    }
  },

  created () {
    this.seeder = new Seeder({
      storageLocation: resolve(this.settings.config.path, '.hyper')
    })
  },

  async started () {
    await this.seeder.init()

    const keys = await this.broker.call('keys.getAll')

    this.seeder.on('drive-add', this.onDriveAdd)
    this.seeder.on('drive-update', this.onDriveUpdate)
    this.seeder.on('drive-remove', this.onDriveRemove)
    this.seeder.on('drive-download', this.onDriveDownload)
    this.seeder.on('drive-upload', this.onDriveUpload)
    this.seeder.on('drive-peer-add', this.onDrivePeerAdd)
    this.seeder.on('drive-peer-remove', this.onDrivePeerRemove)

    this.seed(keys.map(({ key }) => key))
  },

  stopped () {
    // remove listeners
    this.seeder.off('drive-add', this.onDriveAdd)
    this.seeder.off('drive-remove', this.onDriveRemove)
    this.seeder.off('drive-download', this.onDriveDownload)
    this.seeder.off('drive-upload', this.onDriveUpload)
    this.seeder.off('drive-peer-add', this.onDrivePeerAdd)
    this.seeder.off('drive-peer-remove', this.onDrivePeerRemove)

    return this.seeder.destroy()
  }

}
