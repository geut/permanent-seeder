const path = require('path')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')
const compression = require('compression')

module.exports = {
  name: 'api',

  mixins: [ApiGatewayService],

  dependencies: [
    'metrics',
    'seeder',
    'keys'
  ],

  settings: {
    port: 3001,

    // Dashboard site
    assets: {
      folder: path.resolve(__dirname, '../../../dashboard/build')
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
        'GET api/stats/host': 'api.stats.host',
        'GET api/stats/network': 'api.stats.network'
      }
    }],

    cors: true
  },

  events: {
    'seeder.drive.add' (ctx) {
      this.io.emit('drive.add', ctx.params.key)
    },

    'seeder.drive.remove' (ctx) {
      this.io.emit('drive.remove', ctx.params.key)
    },

    'seeder.drive.download' (ctx) {
      this.io.emit(`drive.${ctx.params.key}.download`, ctx.params.key)
    },

    'seeder.drive.upload' (ctx) {
      this.io.emit(`drive.${ctx.params.key}.upload`, ctx.params.key)
    },

    'seeder.drive.peer.add' (ctx) {
      this.io.emit(`drive.${ctx.params.key}.peer.add`, ctx.params.key)
    },

    'seeder.drive.peer.remove' (ctx) {
      this.io.emit(`drive.${ctx.params.key}.peer.remove`, ctx.params.key)
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

    'stats.network': {
      async handler (ctx) {
        return ctx.call('metrics.getNetworkStats')
      }
    },

    'stats.host': {
      async handler (ctx) {
        return ctx.call('metrics.getHostStats')
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

        const drives = []
        for (const { key: publicKey, title } of keys) {
          drives.push({
            key: {
              publicKey,
              title
            },
            size: await this.driveSize(publicKey),
            stats: await this.driveStats(publicKey),
            peers: await this.drivePeers(publicKey)
          })
        }

        return key ? drives[0] : drives
      }
    }
  },

  async started () {
    this.io = IO.listen(this.server)

    this.io.on('connection', client => {
      this.logger.info('SOCKET: Client connected via websocket!')

      client.on('disconnect', () => {
        this.logger.info('SOCKET: Client disconnected')
      })

      client.on('drive.size', async (key, done) => {
        const size = await this.driveSize(key)
        done(size)
      })

      client.on('drive.peers', async (key, done) => {
        const peers = await this.drivePeers(key)
        done(peers)
      })

      client.on('drive.stats', async (key, done) => {
        const stats = await this.driveStats(key)
        done(stats)
      })
    })
  }
}
