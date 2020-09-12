const { homedir } = require('os')
const { join } = require('path')

require('colors')
const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')

const config = require('./config')

class BaseCommand extends Command {
  get configFolderPath () {
    return join(homedir(), 'permanent-seeder')
  }

  getConfig (key) {
    return config.get(key, { configFolderPath: this.configFolderPath })
  }

  checkConfig () {
    const config = this.getConfig()

    if (!config) {
      this.error('Config not initialized.', { suggestions: ['Run config:init command to initialize.'] })
    }

    return config
  }

  startTask (message) {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    cli.action.start(message)
  }

  async stopTask (success = true, timeout = 0) {
    if (process.env.NODE_ENV === 'test') {
      return
    }
    await new Promise(resolve => setTimeout(resolve, timeout))
    cli.action.stop(success ? '✔'.green.bold : '✘'.red.bold)
  }
}

BaseCommand.strict = false

module.exports = BaseCommand
