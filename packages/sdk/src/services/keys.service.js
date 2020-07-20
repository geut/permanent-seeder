// const { resolve, join } = require('path')

const { CronTime } = require('cron')
const Cron = require('moleculer-cron')
const got = require('got')

const { KeysDatabase } = require('@geut/permanent-seeder-database')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'keys',

  mixins: [Config, Cron],

  crons: [
    {
      name: 'update-keys-job',
      manualStart: true,
      cronTime: '* * * * *', // Use config
      onTick: async function () {
        await this.getLocalService('keys')
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
        console.log('updating keys...', new Date())

        let keys = []
        try {
          keys = await got(this.config.endpoint_url).json()

          for (const keyRecord of keys) {
            await ctx.call('keys.add', keyRecord)
          }
        } catch (error) {
          console.error(error)
        }
      }
    }
  },

  created () {
    this.config = {
      ...this.settings.config.keys.db,
      ...this.settings.config.vault
    }

    this.database = new KeysDatabase(this.config.path)

    // Set time based on config
    const updateKeysJob = this.getJob('update-keys-job')
    updateKeysJob.setTime(new CronTime(`*/${this.config.key_fetch_frequency} * * * *`))
    updateKeysJob.start()
  }
}
