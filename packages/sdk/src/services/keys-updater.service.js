const cron = require('cron')
const got = require('got')

const { Config } = require('../mixins/config.mixin')

async function defaultHook (response) {
  return response.json()
}

async function fetchListOfKeys (url, hook, options = {}) {
  const response = got(url, options)

  const keys = await hook(response)
  return keys
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
      await ctx.call('seeder.seed', { keys: ctx.params.keys.map(({ key }) => key), created: true })
    },
    async 'keys.removed' (ctx) {
      await ctx.call('seeder.unseedAll', { keys: ctx.params.keys.map(({ key }) => key) })
    }
  },

  actions: {
    update: {
      async handler (ctx) {
        const { endpoints, remove } = this.settings.config.keys
        this.logger.info({ keys: this.settings.config.keys })
        await this.runUpdate({ add: endpoints[0], remove: remove[0] })
      }
    }
  },

  methods: {
    async runUpdate ({ add = {}, remove = {} }) {
      if (!add.url && !remove.url) return

      this.logger.info({ add, remove }, 'Running update key job for endpoint')

      let hook = defaultHook
      let removeHook = defaultHook

      // Note (dk): check if the user is using the delete keys settings. If so, get the
      // delete endpoint if defined (if not, use default endpoint hook).

      if (add.hook) {
        try {
          hook = require(add.hook)
        } catch (error) {
          this.logger.error(error)
        }
      }

      if (remove.hook) {
        try {
          removeHook = require(remove.hook)
        } catch (error) {
          this.logger.error(error)
        }
      }

      let keysToAdd = []
      let keysToRemove = []
      let skipAdd = false
      let keysToAddLength

      try {
        // Note(dk): if the user has enabled the delete keys endpoint and there is a url present
        // in settings, then perform a second got call to this endpoint. Use the delete hook to parse.

        keysToAdd = await fetchListOfKeys(add.url, hook, { retry: 0, timeout: 5000 })

        keysToAddLength = keysToAdd.length
        if (keysToAddLength) {
          if (this.lastCall.add && (this.lastCall.add === keysToAddLength)) {
            // nothing changed, we can skip adding keys
            skipAdd = true
          }
          this.lastCall.add = keysToAddLength
        }
      } catch (error) {
        this.logger.warn('Add endpoint failed. Cancelling keys update operation.')
        this.logger.warn(error)
        return
      }

      if (remove.url) {
        try {
          keysToRemove = await fetchListOfKeys(remove.url, removeHook, { retry: 0, timeout: 5000 })
          this.lastCall.remove = keysToRemove.length
        } catch (error) {
          this.logger.warn('Remove endpoint failed. Cancelling keys update operation.')
          this.logger.warn(error)
          return
        }
      }

      if (!keysToAdd.length) {
        this.logger.warn('Add keys endpoint returned an empty list. Omitting keys update step.')
        return
      }

      // Note(dk): after getting both responses (from add and delete endpoints -last one is optional-)
      // then we need to merge results. Removing keys from the output if they are present in the delete
      // endpoint result.

      // keysToAdd = [{url: 'A'}, {url: 'B'}] <-- works like an append only log, always adding
      // keysToRemove = [{url:'C'}, {url: 'A'}] <-- same, always adding keys to delete

      // keys = [{url:B}]

      this.logger.info({ lastCall: this.lastCall }, 'runUpdate: this.lastCall updated')
      await this.broker.call('keys.remove', { keys: keysToRemove })

      if (skipAdd) {
        this.logger.info('No changes on keysToAdd. Skipping keys to add update.')
        return
      }

      const keys = keysToAdd
      if (keysToRemove.length) {
        // get the diff
        for (const { url } of keysToRemove) {
          keys.splice(keys.findIndex(item => item.url === url), 1)
        }
      }

      this.logger.info({ keys }, 'runUpdate: final keys')

      await this.broker.call('keys.updateAll', { keys })
    }
  },

  created () {
    const { endpoints, remove = [] } = this.settings.config.keys

    this.endpoints = {}
    this.lastCall = {
      add: 0,
      remove: 0
    }
    // Note(dk): simplifying this step, we only admit 1 add endpoint
    // and 1 removal endpoint

    this.endpoints.add = endpoints[0] || {}
    this.endpoints.remove = remove[0] || {}

    // Note(dk) updates run at the same frequency at the moment
    this.job = new cron.CronJob({
      name: 'update-keys-job-add-remove',
      cronTime: `*/${this.endpoints.add.frequency} * * * *`,
      onTick: () => {
        this.runUpdate({ add: this.endpoints.add, remove: this.endpoints.remove })
      }
    })

    return {
      add: this.endpoints.add,
      remove: this.endpoints.remove,
      job: this.job
    }
  },

  started () {
    this.logger.info('STARTING KEYS UPDATER...')
    // this.crons.forEach(cron => {
    this.job.start()
    this.logger.info({ add: this.endpoints.add.url, remove: this.endpoints.remove.url }, 'Job for key update started')
    this.logger.info('STARTED KEYS UPDATER OK')
    // })
  },

  stopped () {
    this.logger.info('STOPPED KEYS UPDATER')
    // this.crons.forEach(cron => {
    this.job.stop()
    this.logger.info({ add: this.endpoints.add.url, remove: this.endpoints.remove.url }, 'Job for key update stopped')
    // })
  }
}
