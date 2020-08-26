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
      handler () {
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
      return this.seeder.unseed(key)
    },

    driveSize (key) {
      return this.seeder.driveSize(key)
    },

    drivePeers (key) {
      const peers = this.seeder.drivePeers(key)

      return peers.map(peer => ({
        remoteAddress: peer.remoteAddress,
        ...peer.stats
      }))
    },

    driveStats (key) {
      return Object.fromEntries(this.seeder.driveStats(key))
    },

    onDriveAdd (key) {
      this.broker.broadcast('seeder.drive.add', { key })
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
    this.seeder = new Seeder()
  },

  async started () {
    await this.seeder.init()

    const keys = await this.broker.call('keys.getAll')

    this.seeder.on('drive-add', this.onDriveAdd)
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
