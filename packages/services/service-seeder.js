const { ServiceBroker } = require('moleculer')
const Seeder = require('@geut/seeder')

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
      }
    },
    readdir: {
      params: {
        key: { type: 'string' },
        path: { type: 'string', default: '/' }
      },
      async handler (ctx) {
        return this.seeder.drives.get(ctx.params.key).readdir(ctx.params.path)
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

;(async () => {
  // Start the broker
  await broker.start()
})()
