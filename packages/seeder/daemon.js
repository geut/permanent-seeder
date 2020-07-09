const Seeder = require('./')

const { ServiceBroker } = require('moleculer')

// Create a ServiceBroker
const broker = new ServiceBroker({
  transporter: 'TCP'
})

// Define a service
broker.createService({
  name: 'seeder',
  actions: {
    seed: {
      params: {
        keys: { type: 'array', min: 1 }
      },
      async handler (ctx) {
        const keys = ctx.params.keys.map(key => Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex'))
        await this.seeder.seed(keys)
        this.seeder.downloads.get(keys[0].toString('hex')).on('finish', () => {
          ctx.emit('seeder.finish')
        })
      }
    },
    readdir: {
      params: {
        key: { type: 'string' },
        path: { type: 'string', default: '/' }
      },
      async handler (ctx) {
        return this.seeder.drives.get(ctx.params.key).readdir('/')
      }
    }
  },
  created () {
    this.seeder = new Seeder()
  },
  started () {
    return this.seeder.init()
  },
  stopped () {
    return this.seeder.destroy()
  }
})

broker.createService({
  name: 'database',
  events: {
    'seeder.finish': {
      handler (ctx) {
        console.log('finalizooooo!!!!')
      }
    }
  }
})

;(async () => {
  // Start the broker
  await broker.start()
})()
