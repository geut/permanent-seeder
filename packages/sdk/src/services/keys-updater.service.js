// const { resolve, join } = require('path')

const { CronTime } = require('cron')
const Cron = require('moleculer-cron')
const got = require('got')

const { Config } = require('../mixins/config.mixin')

const UPDATER_JOB = 'keys-updater.update-keys-job'

module.exports = {
  name: 'keys-updater',

  mixins: [Config, Cron],

  dependencies: [
    'keys',
    'seeder'
  ],

  events: {
    async 'keys.added' (ctx) {
      await ctx.call('seeder.seed', { keys: ctx.params.keys.map(({ key }) => key) })
    },
    async 'keys.updated' (ctx) {
      await ctx.call('seeder.seed', { keys: ctx.params.keys.map(({ key }) => key) })
    }
  },

  crons: [
    {
      name: UPDATER_JOB,
      manualStart: true,
      cronTime: '* * * * *', // Use config
      onTick: async function () {
        await this.getLocalService('keys-updater')
          .actions
          .updateKeys()
      }
    }
  ],

  actions: {
    updateKeys: {
      async handler () {
        console.log('updating keys...', new Date())

        const keys = await this.fetchKeys()

        this.updateKeys(keys)
      }
    }
  },

  methods: {
    async fetchKeys () {
      try {
        return got(this.config.endpoint_url).json()
      } catch (error) {
        this.logger.error(error)
      }

      return []
    },

    async updateKeys (keys) {
      await this.ctx.call('keys.updateAll', { keys })
    }
  },

  created () {
    this.config = {
      ...this.settings.config.vault
    }

    // Set time based on config
    const updateKeysJob = this.getJob(UPDATER_JOB)
    updateKeysJob.setTime(new CronTime(`*/${this.config.key_fetch_frequency} * * * *`))
    updateKeysJob.start()
  }
}
