const { MetricsDatabase } = require('@geut/permanent-seeder-database')
const top = require('process-top')()
const { getDiskInfo } = require('node-disk-info')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'metrics',

  mixins: [Config],

  events: {
    'seeder.stats': {
      async handler (ctx) {
        await this.database.add(ctx.params)
      }
    }
  },

  actions: {
    get: {
      params: {
        key: { type: 'string', length: '64', hex: true },
        timestamp: { type: 'number', optional: true }
      },
      async handler (ctx) {
        return this.database.filterByTimestamp(ctx.params.key, ctx.params.timestamp)
      }
    },
    getHostInfo: {
      async handler () {
        let disk = {}

        try {
          disk = await getDiskInfo()
        } catch (error) {
          console.error(error)
        }

        return {
          cpu: top.cpu().percent,
          mem: top.memory().percent,
          uptime: top.time(),
          loadavg: top.loadavg(),
          disk
        }
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
      ...this.settings.config.metrics.db
    }

    this.database = new MetricsDatabase(this.config.path)
  },

  async stopped () {
    await this.database.close()
  }

}
