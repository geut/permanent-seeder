const { Config } = require('../mixins/config.mixin')
const { MetricsDatabase } = require('@geut/permanent-seeder-database')

module.exports = {
  name: 'metrics',

  mixins: [Config],

  dependencies: [
    'metricsdb'
  ],

  actions: {
  },

  methods: {

  },

  created () {
    this.config = {
      ...this.seetings.config.metrics.db
    }

    this.database = new MetricsDatabase(this.config.path)
  },

  async started () {
  },

  async stopped () {
    await this.database.close()
  }

}
