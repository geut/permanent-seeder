const { join } = require('path')

const { Command } = require('@oclif/command')

const config = require('./config')

class BaseCommand extends Command {
  get configFolderPath () {
    return join(this.config.home, 'permanent-seeder')
  }

  getConfig (key) {
    return config.get(key, { configFolderPath: this.configFolderPath })
  }
}

BaseCommand.strict = false

module.exports = BaseCommand
