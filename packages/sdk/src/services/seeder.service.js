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

    await this.seed(keys.map(({ key }) => key))
  },

  stopped () {
    return this.seeder.destroy()
  }

}
