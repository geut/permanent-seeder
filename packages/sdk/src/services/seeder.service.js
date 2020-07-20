const { Seeder } = require('@geut/permanent-seeder-core')

const { Config } = require('../mixins/config.mixin')

module.exports = {
  name: 'seeder',

  mixins: [Config],

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

  created () {
    this.seeder = new Seeder()
  },

  started () {
    return this.seeder.init()
  },

  stopped () {
    return this.seeder.destroy()
  }
}
