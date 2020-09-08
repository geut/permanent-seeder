const { MetricsDatabase } = require('@geut/permanent-seeder-database')
const top = require('process-top')()
const { getDiskInfo } = require('node-disk-info')
const isOnline = require('is-online')

const { Config } = require('../mixins/config.mixin')

const EVENTS = {
  'seeder.drive.download': 'drive.download',
  'seeder.drive.upload': 'drive.upload',
  'seeder.drive.update': 'drive.update',
  'seeder.drive.peer.add': 'drive.peeradd',
  'seeder.drive.peer.remove': 'drive.peerremove'
}

module.exports = {
  name: 'metrics',

  settings: {
    hostStatsInterval: 1500,
    networkStatsInterval: 2000
  },

  dependencies: [
    'seeder'
  ],

  mixins: [Config],

  events: {
    'seeder.drive.update': {
      throttle: 1000,
      async handler (ctx) {
        const timestamp = Date.now()
        const { eventName, params: { key } } = ctx
        const stats = await this.broker.call('seeder.driveStats', { key })
        const size = await this.broker.call('seeder.driveSize', { key })
        const peers = await this.broker.call('seeder.drivePeers', { key })
        const event = await this.getEventName(eventName)
        const host = await this.getHostStats()
        await this.saveStats({ key, timestamp, event, stats, size, peers, host })
      }
    },
    'seeder.drive.download': {
      throttle: 1000,
      async handler (ctx) {
        const timestamp = Date.now()
        const { eventName, params: { key } } = ctx
        const peers = await this.broker.call('seeder.drivePeers', { key })
        const event = await this.getEventName(eventName)
        const host = await this.getHostStats()
        await this.saveStats({ key, timestamp, event, peers, host })
      }
    },
    'seeder.drive.upload': {
      throttle: 1000,
      async handler (ctx) {
        const timestamp = Date.now()
        const { eventName, params: { key } } = ctx
        const peers = await this.broker.call('seeder.drivePeers', { key })
        const event = await this.getEventName(eventName)
        const host = await this.getHostStats()
        await this.saveStats({ key, timestamp, event, peers, host })
      }
    },
    'seeder.drive.peer.add': {
      throttle: 1000,
      async handler (ctx) {
        const timestamp = Date.now()
        const { eventName, params: { key } } = ctx
        const peers = await this.broker.call('seeder.drivePeers', { key })
        const event = await this.getEventName(eventName)
        const host = await this.getHostStats()
        const swarm = await this.getNetworkStats()
        await this.saveStats({ key, timestamp, event, peers, host, swarm })
      }
    },
    'seeder.drive.peer.remove': {
      throttle: 1000,
      async handler (ctx) {
        const timestamp = Date.now()
        const { eventName, params: { key } } = ctx
        const peers = await this.broker.call('seeder.drivePeers', { key })
        const event = await this.getEventName(eventName)
        const host = await this.getHostStats()
        const swarm = await this.getNetworkStats()
        await this.saveStats({ key, timestamp, event, peers, host, swarm })
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
    },

    getEventName: {
      handler (systemEvent) {
        console.log({ systemEvent })
        return EVENTS[systemEvent]
      }
    },

    saveStats: {
      async handler (data) {
        // persists stats on metrics db B-)
        if (!this.config.save_stats) {
          return
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
