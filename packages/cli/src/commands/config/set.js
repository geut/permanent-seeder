const config = require('../../config')
const BaseCommand = require('../../base-command')

const ConfigCommand = require('.')

class SetCommand extends ConfigCommand {
  async run () {
    const { args: { key, value } } = this.parse(SetCommand)

    config.set(key, value, { configFolderPath: this.configFolderPath })
  }

  async catch (error) {
    if (error.code === 'CONFIG_FILE_NOT_EXISTS') {
      this.error(error.message, { suggestions: ['Use config:init command to create a default one.'] })
    } else {
      throw error
    }
  }
}

SetCommand.description = 'Sets a config value based on key'

SetCommand.args = [
  { name: 'key', required: true, description: 'Config key to set' },
  {
    name: 'value',
    required: true,
    description: 'Config value to set on key entry',
    parse: input => {
      try {
        const boolOrNumber = JSON.parse(input)
        if (['boolean', 'number'].includes(typeof boolOrNumber)) {
          return boolOrNumber
        }
      } catch {}

      return input
    }
  }
]

SetCommand.flags = {
  ...ConfigCommand.flags,
  ...BaseCommand.flags
}

module.exports = SetCommand
