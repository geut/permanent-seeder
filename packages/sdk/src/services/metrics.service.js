const { Config } = require('../mixins/config.mixin')
const { MetricsDatabase } = require('@geut/permanent-seeder-database')
const top = require('process-top')()
const { getDiskInfo } = require('node-disk-info')

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
        const disk = await getDiskInfo()
        return {
          cpu: top.cpu(),
          mem: top.memory(),
          uptime: top.runtime(),
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
