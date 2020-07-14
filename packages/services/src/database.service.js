const { resolve, join } = require('path')

const { ServiceBroker } = require('moleculer')
const Cron = require('moleculer-cron')
const got = require('got')

const { KeysDatabase } = require('@geut/seeder-database')

// Create a ServiceBroker
const broker = new ServiceBroker({
  transporter: 'TCP'
})

// Define a service
broker.createService({
  name: 'keys-database',

  mixins: [Cron],

  settings: {
    path: resolve(process.env.PS_KEYS_DB_PATH || join(process.cwd(), 'keys.db')),
    updaterInterval: process.env.PS_KEYS_DB_UPDATER_INTERVAL || 5, // minutes
    updaterEndpoint: process.env.PS_KEYS_DB_UPDATER_INTERVAL || 'http://localhost:3000'
  },

  crons: [
    {
      name: 'update-keys-cron',
      cronTime: '* * * * *', // Use config
      onTick: async function () {
        await this.getLocalService('keys-database')
          .actions
          .updateKeys()
      }
    }
  ],

  actions: {
    add: {
      params: {
        key: { type: 'string', length: '64', hex: true },
        title: { type: 'string', empty: 'false' }
      },
      async handler (ctx) {
        console.log('adding key', ctx.params)
        await this.database.add(ctx.params, true)
      }
    },
    get: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      async handler (ctx) {
        return this.database.get(ctx.params.key)
      }
    },
    updateKeys: {
      async handler (ctx) {
        console.log('updating keys...')

        let keys = []
        try {
          keys = await got(this.settings.updaterEndpoint).json()

          for (const keyRecord of keys) {
            await ctx.call('keys-database.add', keyRecord)
          }
        } catch (error) {
          console.error(error)
        }
      }
    }
  },

  created () {
    this.database = new KeysDatabase(this.settings.path)
  },

  started () {
    // return this.seeder.init()
  },

  stopped () {
    // return this.seeder.destroy()
  }
})

;(async () => {
  // Start the broker
  await broker.start()
  // broker.repl()
})()
