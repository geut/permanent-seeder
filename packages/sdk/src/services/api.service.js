const { readFileSync } = require('fs')
const { join, dirname, resolve } = require('path')
const { homedir } = require('os')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')
const compression = require('compression')
const { encode } = require('dat-encoding')
const heapdump = require('heapdump')

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
      'seeder',
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
          'GET api/stats/host': 'api.stats.host',
          'GET api/stats/network': 'api.stats.network',
          'GET api/raw/:key': 'api.raw',
          'GET api/heapdump': 'api.heapdump',
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
      'seeder.drive.add' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.remove' (ctx) {
        this.io.emit('drive.remove', ctx.params.key)
      },

      'seeder.drive.download-started' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.download-finished' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.download' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.upload' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.ready' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.stats' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.update' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.peer.add' (ctx) {
        return this.emitDriveUpdate(ctx.params.key)
      },

      'seeder.drive.peer.remove' (ctx) {
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
        async handler (ctx) {
          return this.drives(ctx.params.key)
        }
      },

      'drives.size': {
        async handler (ctx) {
          return this.driveSize(ctx.params.key)
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

      'drives.stats': {
        async handler (ctx) {
          return this.driveStats(ctx.params.key)
        }
      },

      'drives.add': {
        async handler (ctx) {
          await ctx.call('keys.add', {
            key: encode(ctx.params.key)
          })
        }
      },

      'stats.network': {
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
      },
      heapdump: {
        async handler (ctx) {
          return this.heapdump()
        }
      }
    },

    methods: {
      driveSize: {
        async handler (key) {
          const size = await this.broker.call('seeder.driveSize', { key })
          return size
        }
      },

      driveInfo: {
        async handler (key) {
          const info = await this.broker.call('seeder.driveInfo', { key })
          return info
        }
      },

      drivePeers: {
        async handler (key) {
          const peers = await this.broker.call('seeder.drivePeers', { key })
          return peers
        }
      },

      driveStats: {
        async handler (key) {
          const stats = await this.broker.call('seeder.driveStats', { key })
          return stats
        }
      },

      drives: {
        async handler (key) {
          let keys = []

          if (key) {
            keys.push(await this.broker.call('keys.get', { key }))
          } else {
            keys = await this.broker.call('keys.getAll')
          }

          let drives = []

          drives = await Promise.all(keys.map(({ key }) => {
            return this.drivesDatabase.get(key)
          }))

          return key ? drives[0] : drives
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
      },

      heapdump: {
        async handler () {
          return new Promise((resolve, reject) => {
            const dest = join(homedir(), `heapDump-${Date.now()}.heapsnapshot`)
            heapdump.writeSnapshot(dest, (err) => {
              if (err) {
                this.logger.error(err)
                return reject(err)
              }

              return resolve({ dest })
            })
          })
        }
      }
    },

    created () {
      const drivesDbPath = resolve(this.settings.config.path, 'drives.db')

      this.drivesDatabase = new DrivesDatabase(drivesDbPath)
    },

    async started () {
      this.io = IO.listen(this.server)

      this.io.on('connection', client => {
        this.logger.info('SOCKET: Client connected via websocket!')

        client.on('disconnect', () => {
          this.logger.info('SOCKET: Client disconnected')
        })
      })
    }
  }
}
