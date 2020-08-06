const path = require('path')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')

const EXAMPLE_KEY = 'faa6f1af5e60c4edbc260ea473c0216dc7b5e79ee387922293313c3cdaa1da33'
const EXAMPLE_KEY_1 = '7c9dff14680d00c791e33c9a7698ba4f98ef89bb06c3151d479fe6b050f0cdb3'
const exampleDrive = key => ({
  key,
  title: 'A title for this key',
  peers: 2,
  size: {
    bytes: 2048,
    blocks: 20
  },
  upload: {
    bytes: 512,
    blocks: 5,
    peers: {
      f4e2d07a6ee9ac05f33df3759c41c4de1649d412e5eacfe93210ff6c78afeb14: {
        bytes: 512,
        blocks: 5
      }
    }
  },
  download: {
    bytes: 819.2,
    blocks: 8
  },
  cpu: Math.random(),
  memory: Math.random(),
  disk: Math.random()
})

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
    'stats.**' (payload, sender, event) {
      if (this.io) {
        this.io.emit(event, {
          sender,
          event,
          payload
        })
      }
    }
  },

  actions: {
    drives: {
      async handler () {
        return {
          [EXAMPLE_KEY]: exampleDrive(EXAMPLE_KEY),
          [EXAMPLE_KEY_1]: exampleDrive(EXAMPLE_KEY_1)
        }
      }
    },

    drive: {
      async handler (ctx) {
        return exampleDrive(ctx.params.key)
      }
    }
  },

  started () {
    // // Simulate drive created
    // this.broker.emit('stats.drives', {
    //   faa6f1af5e60c4edbc260ea473c0216dc7b5e79ee387922293313c3cdaa1da33: {}
    // })

    // Drive updates
    setInterval(() => this.broker.emit(`stats.drives.${EXAMPLE_KEY}`, exampleDrive(EXAMPLE_KEY)), 1000)
    setInterval(() => this.broker.emit(`stats.drives.${EXAMPLE_KEY_1}`, exampleDrive(EXAMPLE_KEY_1)), 4200)

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
