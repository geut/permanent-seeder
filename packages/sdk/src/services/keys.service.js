// const { resolve, join } = require('path')

const Cron = require('moleculer-cron')

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
        updateIfExists: { type: 'boolean', default: true },
        key: { type: 'string', length: '64', hex: true },
        title: { type: 'string', empty: 'false' }
      },
      async handler (ctx) {
        const { updateIfExists, ...data } = ctx.params
        await this.database.add(data, updateIfExists)
      }
    },

    get: {
      params: {
        key: { type: 'string', optional: true, length: '64', hex: true }
      },
      async handler (ctx) {
        return this.database.get(ctx.params.key)
      }
    },

    getAll: {
      async handler () {
        return this.database.getAll()
      }
    }

  },

  created () {
    this.config = {
      ...this.settings.config.keys.db
    }

    this.database = new KeysDatabase(this.config.path)
  }
}
