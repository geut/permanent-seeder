const { resolve } = require('path')

const deepEqual = require('deep-equal')
const { encode } = require('dat-encoding')

const { KeysDatabase } = require('@geut/permanent-seeder-database')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'keys',

  mixins: [Config],

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
        const keys = ctx.params.keys.map(datum => {
          const key = encode(datum.url)
          delete datum.url

          return { ...datum, key }
        })
        await this.updateKeys(keys)
      }
    },

    remove: {
      params: {
        keys: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              url: { type: 'string' }
            }
          }
        }
      },
      async handler (ctx) {
        const keys = ctx.params.keys.map(datum => {
          const key = encode(datum.url)

          return { key }
        })
        this.logger.info('keys service: remove handler')
        await this.removeKeys(keys)
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

    async removeKeys (keys) {
      this.logger.info({ keys }, 'keys service: removeKeys method ')
      await this.database.batch(keys)
      if (keys.length) {
        this.broker.broadcast('keys.removed', { keys })
      }
    },

    async updateKeys (keys) {
      const updateResult = await Promise.all(keys.map(keyRecord => this.update(keyRecord)))

      const created = updateResult.filter(({ created }) => created).map(({ keyRecord }) => keyRecord)

      if (created.length) {
        this.broker.cacher.clean()
      }

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
