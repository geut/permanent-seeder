const { resolve } = require('path')

const Cron = require('moleculer-cron')
const deepEqual = require('deep-equal')
const { encode } = require('dat-encoding')

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
              url: { type: 'string' },
              id: { type: 'number' },
              created_at: { type: 'string' }
            }
          }
        }
      },
      async handler (ctx) {
        this.logger.info(ctx.params.keys)
        const keys = ctx.params.keys.map(datum => {
          const key = encode(datum.url)
          delete datum.url

          return { ...datum, key }
        })
        await this.updateKeys(keys)
      }
    },

    add: {
      params: {
        key: { type: 'string', length: '64', hex: true }
      },
      async handler (ctx) {
        return this.updateKeys([ctx.params])
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
    const keysDbPath = resolve(this.settings.config.path, 'keys.db')

    this.database = new KeysDatabase(keysDbPath)
  },

  async stopped () {
    await this.database.close()
  }
}
