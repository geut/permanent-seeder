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

      routes: [{
        use: [
          compression()
        ],
        aliases: {
          'GET api/drives/:key?': 'api.drives',
          'GET api/drives/:key/size': 'api.drives.size',
          'GET api/drives/:key/peers': 'api.drives.peers',
          'GET api/drives/:key/stats': 'api.drives.stats',
          'GET api/drives/:key/info': 'api.drives.info',
          'GET api/drives/:key/seedingStatus': 'api.drives.seedingStatus',
          'GET api/stats/host': 'api.stats.host',
          'GET api/stats/network': 'api.stats.network',
          'GET api/raw/:key': 'api.raw',
          'POST api/drives': 'api.drives.add'
        }
      }],

      onError (req, res, err) {
        res.setHeader('Content-Type', 'text/plain')
        res.writeHead(501)
        res.end(err.message)
      },

      cors: true
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

      'drives.info': {
        async handler (ctx) {
          return this.driveInfo(ctx.params.key)
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

      this.drivesDatabase = new DrivesDatabase(drivesDbPath)
      this.recentlyAdded = new Map()
    },

    async started () {
      this.io = IO.listen(this.server)
    }
  }
}
