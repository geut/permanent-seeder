const { join, resolve } = require('path')
const { Command } = require('@oclif/command')

const config = require('./config')

class BaseCommand extends Command {
  get localConfigFolderPath () {
    return resolve(process.cwd())
  }

  get globalConfigFolderPath () {
    return join(this.config.home, 'permanent-seeder')
  }

  getConfig (key) {
    const configValues = config.get(key, {
      globalConfigFolderPath: this.globalConfigFolderPath,
      localConfigFolderPath: this.localConfigFolderPath
    })

    return configValues
  }
}

BaseCommand.strict = false

module.exports = BaseCommand
