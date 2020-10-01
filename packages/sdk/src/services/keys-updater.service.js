const cron = require('cron')
const got = require('got')

const { Config } = require('../mixins/config.mixin')

async function defaultHook (response) {
  return response.json()
}

module.exports = {
  name: 'keys-updater',

  mixins: [Config],

  dependencies: [
    'keys',
    'seeder'
  ],

  events: {
    async 'keys.created' (ctx) {
      await ctx.call('seeder.seed', { keys: ctx.params.keys.map(({ key }) => key) })
    },
    async 'keys.updated' (ctx) {
      await ctx.call('seeder.seed', { keys: ctx.params.keys.map(({ key }) => key) })
    }
  },

  actions: {
    update: {
      async handler (ctx) {
        const { endpoints } = this.settings.config.keys
        for (const endpoint of endpoints) {
          await this.runUpdate(endpoint)
        }
      }
    }
  },

  methods: {
    async runUpdate (endpoint) {
      let hook = defaultHook

      if (endpoint.hook) {
        try {
          hook = require(endpoint.hook)
        } catch (error) {
          this.logger.error(error)
        }
      }

      try {
        const response = got(endpoint.url)

        const keys = await hook(response)

        await this.broker.call('keys.updateAll', { keys })
      } catch (error) {
        this.logger.error(error)
      }
    }
  },

  created () {
    const { endpoints } = this.settings.config.keys

    this.crons = endpoints.map((endpoint, index) => {
      const job = new cron.CronJob({
        name: `update-keys-job-${index}`,
        cronTime: `*/${endpoint.frequency} * * * *`,
        onTick: () => {
          this.runUpdate(endpoint)
        }
      })

      return {
        ...endpoint,
        job
      }
    })
  },

  started () {
    this.crons.forEach(cron => {
      cron.job.start()
      this.logger.info(`Job for key update started - ${cron.url}`)
    })
  },

  stopped () {
    this.crons.forEach(cron => {
      cron.job.stop()
      this.logger.info(`Job for key update stopped - ${cron.url}`)
    })
  }
}
