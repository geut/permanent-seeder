const { resolve } = require('path')
const { flags } = require('@oclif/command')

const BaseCommand = require('../../base-command')

class ConfigCommand extends BaseCommand {
  async run () {
    this._help()
  }

  get localConfigFolderPath () {
    return resolve(__dirname)
  }

  get globalConfigFolderPath () {
    return this.config.home
  }
}

ConfigCommand.usage = ['config:[init|list|set|get]']

ConfigCommand.description = 'Configuration commands'

ConfigCommand.flags = {
  global: flags.boolean({ char: 'g', description: 'Use global config', default: false })
}

module.exports = ConfigCommand
