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
      async handler (ctx) {
        console.log('updating keys...', new Date())

        const newKeys = []
        try {
          const keys = await got(this.config.endpoint_url).json()

          for (const keyRecord of keys) {
            const existentKey = await ctx.call('keys.get', { key: keyRecord.key })

            await ctx.call('keys.update', keyRecord)

            if (!existentKey) {
              newKeys.push(keyRecord)
            }
          }

          await ctx.call('seeder.seed', { keys: newKeys })
        } catch (error) {
          this.logger.error(error)
        }
      }
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
