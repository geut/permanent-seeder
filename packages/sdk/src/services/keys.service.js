const Cron = require('moleculer-cron')
const deepEqual = require('deep-equal')

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
    updateAll: {
      params: {
        keys: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              key: { type: 'string', length: '64', hex: true },
              title: { type: 'string', empty: 'false' }
            }
          }
        }
      },
      async handler (ctx) {
        await this.updateKeys(ctx.params.keys)
      }
    },

    add: {
      params: {
        key: { type: 'string', length: '64', hex: true },
        title: { type: 'string', empty: 'false' }
      },
      async handler (ctx) {
        this.updateKeys([ctx.params])
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

    getAll: {
      async handler () {
        return this.database.getAll()
      }
    }

  },

  methods: {
    async update (keyRecord) {
      const existent = await this.database.get(keyRecord.key)

      if (deepEqual(existent, keyRecord)) {
        return { updated: false, created: false, keyRecord }
      }

      try {
        const created = await this.database.update(keyRecord, true)

        return { updated: !created, created, keyRecord }
      } catch (error) {
        this.logger.error(error)
      }
    },

    async updateKeys (keys) {
      const updateResult = await Promise.all(keys.map(keyRecord => this.update(keyRecord)))

      const updated = updateResult.filter(({ updated }) => updated).map(({ keyRecord }) => keyRecord)
      const created = updateResult.filter(({ created }) => created).map(({ keyRecord }) => keyRecord)

      updated.length && this.broker.broadcast('keys.updated', { keys: updated })
      created.length && this.broker.broadcast('keys.created', { keys: created })
    }
  },

  created () {
    this.config = {
      ...this.settings.config.keys.db
    }

    this.database = new KeysDatabase(this.config.path)
  },

  async stopped () {
    await this.database.close()
  }
}
