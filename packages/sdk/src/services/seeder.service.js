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

    getDriveStats: {
      params: {
        key: { type: 'string' },
        path: { type: 'string', optional: true }
      },
      async handler (ctx) {
        return this.seeder.getDriveStats(ctx.params.key, ctx.params.path)
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
    this.seeder.on('drive-new', async (key) => {
      const stat = await this.seeder.stat(key)
      const timestamp = Date.now()
      this.broker.broadcast('seeder.stats', { key, timestamp, stat })
    })
    this.seeder.on('drive-download', async (key) => {
      const stat = await this.seeder.stat(key)
      const timestamp = Date.now()
      this.broker.broadcast('seeder.stats', { key, timestamp, stat })
    })

    this.seeder.on('drive-upload', async (key) => {
      const stat = await this.seeder.stat(key)
      const timestamp = Date.now()
      this.broker.broadcast('seeder.stats', { key, timestamp, stat })
    })

    await this.seed(keys.map(({ key }) => key))
  },

  stopped () {
    // remove listeners
    this.seeder.removeAllListeners('drive-new')
    this.seeder.removeAllListeners('drive-download')
    this.seeder.removeAllListeners('drive-upload')
    return this.seeder.destroy()
  }

}
