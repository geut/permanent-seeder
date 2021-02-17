const { resolve } = require('path')

const { encode } = require('dat-encoding')

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
        keys: { type: 'array', min: 1 },
        created: { type: 'boolean', optional: true, default: false }
      },
      async handler (ctx) {
        this.logger.info({ created: ctx.params.created }, 'seeder actions created?')
        return this.seed(ctx.params.keys, ctx.params.created)
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

    drivePeers: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      async handler (ctx) {
        return this.drivePeers(ctx.params.key)
      }
    },

    getSwarmStats: {
      async handler () {
        return this.seeder.getSwarmStats()
      }
    }
  },

  methods: {
    async seed (keys, created) {
      const keysToSeed = []

      for (let key of keys) {
        key = encode(key)

        // TODO(Esteban): Move from here
        let dbDrive = await this.database.get(key)

        if (!dbDrive) {
          await this.database.create(key)
          dbDrive = await this.database.get(key)
        }

        if (!dbDrive.deletedAt) {
          keysToSeed.push({ key, size: dbDrive.size })
        }
      }

      return this.seeder.seed(keysToSeed, created)
    },

    async unseed (key) {
      this.logger.info({ key }, 'Unseed key')
      return this.seeder.unseed(key)
    },

    drivePeers (key) {
      return this.seeder.drivePeers(key)
    },

    async onDriveAdd (key) {
      this.broker.broadcast('seeder.drive.add', { key })
    },

    async onDriveRemove (key) {
      await this.database.remove(key)
      this.broker.broadcast('seeder.drive.remove', { key })
      this.broker.cacher.clean()
    },

    async onDriveUpdate (key, { size, seedingStatus }) {
      await this.database.update(key, { size, seedingStatus })

      this.broker.broadcast('seeder.drive.update', { key })
    },

    async onDriveInfo (key, { info }) {
      await this.database.update(key, { info })

      this.broker.broadcast('seeder.drive.info', { key })
    },

    async onDriveDownloadResume (key, { size, seedingStatus }) {
      await this.database.update(key, {
        size,
        ...{ seedingStatus }
      })
      this.broker.broadcast('seeder.drive.download.resume', { key, size })
    },

    async onDriveDownloadFix (key, { size }) {
      await this.database.update(key, {
        size
      })
    },

    async onDriveDownload (key, { size, seedingStatus, started = false, finished = false }) {
      await this.database.update(key, {
        size,
        ...(started || finished ? { seedingStatus } : undefined)
      })

      if (started) {
        this.broker.broadcast('seeder.drive.download-started', { key, size })
      } else if (finished) {
        this.broker.broadcast('seeder.drive.download-finished', { key, size })
      } else {
        this.broker.broadcast('seeder.drive.download', { key, size })
      }
    },

    async onDriveUpload (key) {
      this.broker.broadcast('seeder.drive.upload', { key })
    },

    async onDrivePeerAdd (key, { peers }) {
      await this.database.update(key, { peers })
      this.broker.broadcast('seeder.drive.peer.add', { key })
    },

    async onDrivePeerRemove (key, { peers }) {
      await this.database.update(key, { peers })
      this.broker.broadcast('seeder.drive.peer.remove', { key })
    },

    async onDriveStats (key, { stats }) {
      await this.database.update(key, { stats })
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

    let secret = this.settings.config.secret
    if (!secret) {
      this.logger.warn('It is recommended to setup a secret value in the config. See more here: https://github.com/geut/permanent-seeder#secret')
      secret = 'defaultS3cret!'
    }

    this.seeder = new Seeder({
      storageLocation: resolve(this.settings.config.path, '.hyper'),
      networker,
      logger: this.logger,
      secret
    })

    const drivesDbPath = resolve(this.settings.config.path, 'drives.db')

    this.database = new DrivesDatabase(drivesDbPath)
  },

  async started () {
    await this.seeder.init()

    const keys = await this.broker.call('keys.getAll')

    this.seeder.on('drive-add', this.onDriveAdd)
    this.seeder.on('drive-download', this.onDriveDownload)
    this.seeder.on('drive-download-resume', this.onDriveDownloadResume)
    this.seeder.on('drive-download-fix', this.onDriveDownloadFix)
    this.seeder.on('drive-info', this.onDriveInfo)
    this.seeder.on('drive-peer-add', this.onDrivePeerAdd)
    this.seeder.on('drive-peer-remove', this.onDrivePeerRemove)
    this.seeder.on('drive-remove', this.onDriveRemove)
    this.seeder.on('drive-stats', this.onDriveStats)
    this.seeder.on('drive-update', this.onDriveUpdate)
    this.seeder.on('drive-upload', this.onDriveUpload)
    this.seeder.on('networker-peer-add', this.onSwarmPeerAdd)
    this.seeder.on('networker-peer-remove', this.onSwarmPeerRemove)

    this.seed(keys.map(({ key }) => key))
  },

  async stopped () {
    // remove listeners
    this.seeder.off('drive-add', this.onDriveAdd)
    this.seeder.off('drive-download', this.onDriveDownload)
    this.seeder.off('drive-download-resume', this.onDriveDownloadResume)
    this.seeder.off('drive-download-fix', this.onDriveDownloadFix)
    this.seeder.off('drive-info', this.onDriveInfo)
    this.seeder.off('drive-peer-add', this.onDrivePeerAdd)
    this.seeder.off('drive-peer-remove', this.onDrivePeerRemove)
    this.seeder.off('drive-remove', this.onDriveRemove)
    this.seeder.off('drive-stats', this.onDriveStats)
    this.seeder.off('drive-update', this.onDriveUpdate)
    this.seeder.off('drive-upload', this.onDriveUpload)
    this.seeder.off('networker-peer-add', this.onSwarmPeerAdd)
    this.seeder.off('networker-peer-remove', this.onSwarmPeerRemove)

    return this.seeder.destroy()
  }

}
