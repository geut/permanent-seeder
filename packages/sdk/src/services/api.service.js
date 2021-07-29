const { readFileSync } = require('fs')
const { dirname, resolve } = require('path')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')
const compression = require('compression')
const { encode } = require('dat-encoding')

const { DrivesDatabase } = require('@geut/permanent-seeder-database')
const dashboard = require.resolve('@geut/permanent-seeder-dashboard')

const { Config } = require('../mixins/config.mixin')

module.exports = function (broker) {
  const API_VERSION = broker.metadata.version
  broker.logger.info({ API_VERSION }, 'API VERSION')
  let { api: { https, port = 3001 } = {} } = broker.metadata.config

  try {
    if (https) {
      https = {
        key: readFileSync(https.key),
        cert: readFileSync(https.cert)
      }
    }
  } catch (error) {
    broker.logger.error(error)
  }

  return {
    name: 'api',

    mixins: [ApiGatewayService, Config],

    dependencies: [
      'metrics',
      'keys'
    ],

    settings: {
      port,

      https,

      // Dashboard site
      assets: {
        folder: dirname(dashboard)
      },

      whitelist: [
        'api.*'
      ],

      path: `api/${API_VERSION}`,

      routes: [{
        use: [
          compression()
        ],
        aliases: {
          'GET drives/:key?': 'api.drives',
          'GET drives/:key/size': 'api.drives.size',
          'GET drives/:key/peers': 'api.drives.peers',
          'GET drives/:key/stats': 'api.drives.stats',
          'GET drives/:key/info': 'api.drives.info',
          'GET drives/:key/versions': 'api.drives.versions',
          'GET drives/:key/:version/info': 'api.drives.infoByVersion',
          'GET drives/:key/:version/stats': 'api.drives.statsByVersion',
          'GET drives/:key/seedingStatus': 'api.drives.seedingStatus',
          'GET stats/host': 'api.stats.host',
          'GET stats/network': 'api.stats.network',
          'GET raw/:key': 'api.raw',
          'GET drives/keys': 'api.keys',
          'POST drives': 'api.drives.add'
        }
      }],

      onError (req, res, err) {
        res.setHeader('Content-Type', 'text/plain')
        res.writeHead(501)
        res.end(err.message)
      }
    },

    events: {
      'seeder.drive.*' (ctx) {
        if (ctx.eventName === 'seeder.drive.remove') {
          return this.io.emit('drive.remove', ctx.params.key)
        }

        return this.emitDriveUpdate(ctx.params.key)
      },

      'stats.host' (ctx) {
        this.io.emit('stats.host', ctx.params.stats)
      },

      'stats.network' (ctx) {
        this.io.emit('stats.network', ctx.params.stats)
      }
    },

    actions: {
      drives: {
        cache: true,
        async handler (ctx) {
          return this.drives(ctx.params.key)
        }
      },

      'drives.add': {
        async handler (ctx) {
          await ctx.call('keys.add', {
            key: encode(ctx.params.key)
          })
          this.recentlyAdded.set(ctx.params.key, true)
          this.broker.cacher.clean()
        }
      },

      'drives.versions': {
        async handler (ctx) {
          return this.driveVersions(ctx.params.key)
        }
      },

      'drives.info': {
        async handler (ctx) {
          return this.driveInfo(ctx.params.key)
        }
      },

      'drives.infoByVersion': {
        async handler (ctx) {
          return this.driveFieldByVersion(ctx.params.key, ctx.params.version, 'info')
        }
      },

      'drives.statsByVersion': {
        async handler (ctx) {
          return this.driveFieldByVersion(ctx.params.key, ctx.params.version, 'stats')
        }
      },

      'drives.peers': {
        async handler (ctx) {
          return this.drivePeers(ctx.params.key)
        }
      },

      'drives.size': {
        async handler (ctx) {
          return this.driveSize(ctx.params.key)
        }
      },

      'drives.seedingStatus': {
        async handler (ctx) {
          return this.driveSeedingStatus(ctx.params.key)
        }
      },

      'drives.stats': {
        async handler (ctx) {
          return this.driveStats(ctx.params.key)
        }
      },

      'stats.network': {
        cache: {
          ttl: 5
        },
        async handler (ctx) {
          return ctx.call('metrics.getNetworkStats')
        }
      },

      'stats.host': {
        async handler (ctx) {
          return ctx.call('metrics.getHostStats')
        }
      },

      raw: {
        async handler (ctx) {
          return this.raw(ctx.params.key)
        }
      },

      keys: {
        async handler (ctx) {
          return this.keys()
        }
      },

      'raw.event': {
        async handler (ctx) {
          return this.raw(ctx.params.key, ctx.params.event)
        }
      }
    },

    methods: {
      driveInfo: {
        async handler (key) {
          return this.drivesDatabase.get(key, 'info')
        }
      },

      driveFieldByVersion: {
        async handler (key, version, field) {
          return this.drivesDatabase.getByVersion(key, version, field)
        }
      },

      keys: {
        async handler () {
          return this.drivesDatabase.getKeys()
        }
      },

      driveVersions: {
        async handler (key) {
          return this.drivesDatabase.getVersions(key)
        }
      },

      drivePeers: {
        async handler (key) {
          return this.drivesDatabase.get(key, 'peers')
        }
      },

      driveSeedingStatus: {
        async handler (key) {
          return this.drivesDatabase.get(key, 'seedingStatus')
        }
      },

      driveSize: {
        async handler (key) {
          return this.drivesDatabase.get(key, 'size')
        }
      },

      driveStats: {
        async handler (key) {
          return this.drivesDatabase.get(key, 'stats')
        }
      },

      drives: {
        async handler (key) {
          let keys = []

          if (key) {
            const value = await this.broker.call('keys.get', { key })
            if (value) {
              keys.push(value)
            }
          } else {
            keys = await this.broker.call('keys.getAll') || []
          }

          let drives = []

          drives = await Promise.all(keys.map(({ key }) => {
            return this.drivesDatabase.get(key)
          }))

          drives.forEach((item, idx) => {
            const key = item.key
            const recentlyAdded = this.recentlyAdded.get(key)

            drives[idx].recentlyAdded = !!recentlyAdded
            if (recentlyAdded) {
              this.recentlyAdded.set(key, false)
            }
          })

          return key && drives[0] ? drives[0] : drives
        }
      },

      emitDriveUpdate: {
        async handler (key) {
          const drive = await this.drives(key)
          this.logger.info({ key }, 'emitDriveUpdate')

          return this.io.emit('update', drive)
        }
      },

      raw: {
        async handler (key, timestamp) {
        // get all keys from timestamp (optional)
          const stats = await this.broker.call('metrics.get', { key, timestamp })
          return stats
        }
      }
    },

    created () {
      const drivesDbPath = resolve(this.settings.config.path, 'drives.db')

      this.drivesDatabase = new DrivesDatabase(drivesDbPath, this.logger)
      this.recentlyAdded = new Map()
    },

    async started () {
      this.io = IO(this.server)
    }
  }
}
