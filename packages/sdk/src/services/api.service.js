const path = require('path')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')

module.exports = {
  name: 'api',

  mixins: [ApiGatewayService],

  dependencies: [
    'metrics'
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
      aliases: {
        'GET api/keys/:key?': 'api.keys',
        'GET api/stats/keys/:key?': 'api.stats.keys'
      }
    }],

    cors: true
  },

  events: {
    'seeder.stats' (payload) {
      if (this.io) {
        this.io.emit(`stats.keys.${payload.key.toString('hex')}`, payload.stat)
      }
    },

    async 'keys.created' (ctx) {
      const keys = await ctx.call('keys.getAll')
      if (this.io) {
        this.io.emit('keys', keys)
      }
    }
  },

  actions: {
    keys: {
      async handler (ctx) {
        const { key } = ctx.params

        if (key) {
          return ctx.call('keys.get', { key: ctx.params.key })
        }

        return ctx.call('keys.getAll')
      }
    },

    'stats.keys': {
      async handler (ctx) {
        const { key } = ctx.params

        if (key) {
          return ctx.call('metrics.get', { key: ctx.params.key, timestamp: ctx.params.timestamp })
        }

        return ctx.call('metrics.getAll')
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
    })
  }
}
