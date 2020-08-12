const { Seeder } = require('@geut/permanent-seeder-core')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'seeder',

  mixins: [Config],

  dependencies: [
    'keys'
  ],

  actions: {
    seed: {
      params: {
        keys: { type: 'array', min: 1 }
      },
      async handler (ctx) {
        return this.seed(ctx.params.keys)
      }
    },

    unseed: {
      params: {
        key: { type: 'string', optional: true }
      },
      async handler (ctx) {
        return this.unseed(ctx.params.key)
      }
    },

    stats: {
      async handler (ctx) {
        return this.seeder.allStats()
      }
    },

    stat: {
      params: {
        key: { type: 'string' }
      },
      async handler (ctx) {
        return this.seeder.stat(ctx.params.key)
      }
    },

    getSwarmStats: {
      handler () {
        return this.seeder.getSwarmStats()
      }
    },

    readdir: {
      params: {
        key: { type: 'string' },
        path: { type: 'string', default: '/' }
      },
      async handler (ctx) {
        return this.seeder.drives.get(ctx.params.key).readdir(ctx.params.path)
      }
    }
  },

  methods: {
    async seed (keyBuffers) {
      const keys = keyBuffers.map(key => Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex'))
      return this.seeder.seed(keys)
    },

    async broadcastEvent ({ event, key }) {
      const stat = await this.seeder.stat(key)
      const timestamp = Date.now()
      this.broker.broadcast('seeder.stats', { key, timestamp, stat, event })
    }

  },

  created () {
    this.seeder = new Seeder()
  },

  async started () {
    await this.seeder.init()

    const keys = await this.broker.call('keys.getAll')

    this.logger.info('hook seeder events')

    // hook seeder events
    this.seeder.on('add', (key) => this.broadcastEvent({ key, event: 'add' }))

    this.seeder.on('watch-update', (key) => this.broadcastEvent({ key, event: 'watch-update' }))

    this.seeder.on('download', (key) => this.broadcastEvent({ key, event: 'download' }))

    this.seeder.on('upload', (key) => this.broadcastEvent({ key, event: 'upload' }))

    this.seeder.on('peer-add', (key) => this.broadcastEvent({ key, event: 'peer-add' }))

    this.seeder.on('peer-remove', (key) => this.broadcastEvent({ key, event: 'peer-remove' }))

    this.seeder.on('sync', (key) => this.broadcastEvent({ key, event: 'sync' }))

    await this.seed(keys.map(({ key }) => key))
  },

  stopped () {
    // remove listeners
    this.seeder.removeListener('add', this.broadcastEvent)
    this.seeder.removeListener('download', this.broadcastEvent)
    this.seeder.removeListener('upload', this.broadcastEvent)
    this.seeder.removeListener('peer-add', this.broadcastEvent)
    this.seeder.removeListener('peer-remove', this.broadcastEvent)
    this.seeder.removeListener('sync', this.broadcastEvent)
    this.seeder.removeListener('watch-update', this.broadcastEvent)
    return this.seeder.destroy()
  }

}
