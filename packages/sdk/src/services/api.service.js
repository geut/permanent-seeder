const path = require('path')

const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')
// this key does not matter
const EXAMPLE_KEY = '2d7f8e3d9fc29da5a31297b145377eae54af200bbd2f85628eb35c6612189bc1'

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
    'seeder.stats' (payload, sender, event) {
      
      if (this.io) {
        const eventName = `stats.drives.${payload.key.toString('hex')}`
        this.io.emit(eventName, {
          sender,
          event,
          payload: payload.stat
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
