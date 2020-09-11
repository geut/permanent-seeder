const BaseCommand = require('../../base-command')

class ConfigCommand extends BaseCommand {
  async run () {
    this._help()
  }
}

ConfigCommand.usage = ['config:[init|list|set|get]']

ConfigCommand.description = 'Configuration commands'

module.exports = ConfigCommand
