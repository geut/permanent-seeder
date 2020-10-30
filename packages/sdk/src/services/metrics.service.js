const { resolve } = require('path')
const { promisify } = require('util')

const { MetricsDatabase } = require('@geut/permanent-seeder-database')
const top = require('process-top')()
const { fsize } = require('nodejs-fs-utils')
const pMemoize = require('p-memoize')
const isOnline = require('is-online')

const { Config } = require('../mixins/config.mixin')

const dirSize = pMemoize(promisify(fsize), { maxAge: 2000 })

module.exports = {
  name: 'metrics',

  settings: {
    hostStatsInterval: 1000 * 60, // 1min check
    networkStatsInterval: 1000 * 60 * 60 // 1hr check
  },

  mixins: [Config],

  events: {
    'seeder.drive.*': {
      async handler (ctx) {
        const timestamp = Date.now()
        const { eventName: event, params: { key, ...rest } } = ctx
        await this.saveStats({ key, timestamp, event, ...rest })
      }
    },
    'seeder.networker.peer.*': {
      debounce: 1000,
      async handler (ctx) {
        const stats = await this.getNetworkStats()
        this.broker.broadcast('stats.network', { stats })
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
        let disk = ''

        try {
          disk = await dirSize(this.config.path, { skipErrors: true })
        } catch (error) {
          console.error(error)
        }

        return {
          cpu: top.cpu().percent,
          mem: top.memory().percent,
          uptime: top.time(),
          loadavg: top.loadavg(),
          disk: { directory: disk }
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
    },

    saveStats: {
      async handler (data) {
        // persists stats on metrics db B-)
        if (!this.config.saveStats) {
          return
        }

        if (data.event === 'seeder.drive.download-started' || data.event === 'seeder.drive.download-finished') {
          data.host = await this.getHostStats()
        }
        if (data.event !== 'seeder.drive.download' && data.event !== 'seeder.drive.remove') {
          data.peers = await this.broker.call('seeder.drivePeers', { key: data.key })
        }
        return this.database.add(data)
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
      saveStats: this.settings.config.save_stats,
      path: this.settings.config.path
    }

    const metricsDbPath = resolve(this.settings.config.path, 'metrics.db')

    this.database = new MetricsDatabase(metricsDbPath)
  },

  async stopped () {
    await this.database.close()
    clearInterval(this.hostInfoInterval)
    clearInterval(this.networkInfoInterval)
  }

}
