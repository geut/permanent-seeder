const config = require('../../config')
const BaseCommand = require('../../base-command')

const ConfigCommand = require('.')

class GetCommand extends ConfigCommand {
  async run () {
    const { args: { key } } = this.parse(GetCommand)

    const configValues = config.get(key, {
      configFolderPath: this.configFolderPath
    })

    if (key && configValues === undefined) {
      return this.warn(`No config key found: ${key}`)
    }

    this.log(JSON.stringify(configValues, null, 2))
  }
}

GetCommand.description = 'Shows a config entry based on key'

GetCommand.args = [
  { name: 'key', description: 'Config key to show\nIf not present shows all config entries' }
]

GetCommand.flags = {
  ...ConfigCommand.flags,
  ...BaseCommand.flags
}

module.exports = GetCommand
