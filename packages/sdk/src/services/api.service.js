const path = require('path')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')

// Example key
// const EXAMPLE_KEY = 'ea500089febf96665ae5fbeccb1b4f85228c72ba3bf248ea0fcb52af646781db'

// const exampleDrive = key => ({
//   content: {},
//   metadata: {
//     key: Buffer.from(key, 'hex'),
//     discoveryKey: Buffer.from(key, 'hex'),
//     peerCount: 1,
//     peers: [
//       {
//         uploadedBytes: 101,
//         uploadedBlocks: 2,
//         downloadedBytes: 0,
//         downloadedBlocks: 0,
//         remoteAddress: '::ffff:192.168.0.223'
//       }
//     ],
//     uploadedBytes: 101,
//     uploadedBlocks: 2,
//     downloadedBytes: 0,
//     downloadedBlocks: 5,
//     totalBlocks: 5
//   },
//   network: {
//     announce: true,
//     lookup: false
//   }
// })

module.exports = {
  name: 'api',

  mixins: [ApiGatewayService],

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
        'GET api/drives': 'api.drives',
        'GET api/drives/:key': 'api.drive'
      }
    }],

    cors: true
  },

  events: {
    'seeder.stats' (payload) {
      if (this.io) {
        this.io.emit('seeder.stats', payload.stat)
        this.io.emit(`seeder.stats.${payload.key.toString('hex')}`, payload.stat)
      }
    }
  },

  actions: {
    drives: {
      async handler (ctx) {
        const all = await ctx.call('metrics.getAll')
        return all
      }
    },

    drive: {
      async handler (ctx) {
        return ctx.call('metrics.get', { key: ctx.params.key, timestamp: ctx.params.timestamp })
      }
    }
  },

  started () {

    // Create a Socket.IO instance, passing it our server
    this.io = IO.listen(this.server)

    // Add a connect listener
    this.io.on('connection', client => {
      this.logger.info('SOCKET: Client connected via websocket!')

      client.on('disconnect', () => {
        this.logger.info('SOCKET: Client disconnected')
      })
    })
  }
}
