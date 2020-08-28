const { MetricsDatabase } = require('@geut/permanent-seeder-database')
const top = require('process-top')()
const { getDiskInfo } = require('node-disk-info')
const isOnline = require('is-online')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'metrics',

  settings: {
    hostStatsInterval: 1500,
    networkStatsInterval: 2000
  },

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

    getAll: {
      async handler () {
        return this.database.getAll()
      }
    },

    getHostStats: {
      async handler () {
        return this.getHostStats()
      }
    },

    getNetworkStats: {
      async handler () {
        return this.getNetworkStats()
      }
    }
  },

  methods: {
    getHostStats: {
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

    getNetworkStats: {
      async handler () {
        const swarmStats = await this.broker.call('seeder.getSwarmStats')
        const online = await isOnline()

        return {
          online,
          swarm: swarmStats
        }
      }
    }
  },

  started () {
    this.hostInfoInterval = setInterval(async () => {
      const stats = await this.broker.call('metrics.getHostStats')
      this.broker.broadcast('stats.host', { stats })
    }, this.settings.hostStatsInterval)

    this.networkInfoInterval = setInterval(async () => {
      const stats = await this.broker.call('metrics.getNetworkStats')
      this.broker.broadcast('stats.network', { stats })
    }, this.settings.networkStatsInterval)
  },

  created () {
    this.config = {
      ...this.settings.config.metrics.db
    }

    this.database = new MetricsDatabase(this.config.path)
  },

  async stopped () {
    await this.database.close()
    clearInterval(this.hostInfoInterval)
    clearInterval(this.networkInfoInterval)
  }

}
