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
        const keys = ctx.params.keys.map(key => Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex'))
        await this.seeder.seed(keys)
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
    async startSeeding () {
      const keys = await this.broker.call('keys.getAll')

      console.log({ keys })

      await this.broker.call('seeder.seed', { keys })
    }
  },

  created () {
    this.seeder = new Seeder()
  },

  async started () {
    await this.seeder.init()

    await this.broker.waitForServices(['keys'])

    setTimeout(async () => {
      await this.startSeeding()
    })
  },

  stopped () {
    return this.seeder.destroy()
  }

}
