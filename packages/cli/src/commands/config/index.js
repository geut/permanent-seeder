const { flags } = require('@oclif/command')

const BaseCommand = require('../../base-command')

class ConfigCommand extends BaseCommand {
  async run () {
    this._help()
  }
}

ConfigCommand.usage = ['config:[init|list|set|get]']

ConfigCommand.description = 'Configuration commands'

ConfigCommand.flags = {
  global: flags.boolean({ char: 'g', description: 'Use global config', default: false })
}

module.exports = ConfigCommand
