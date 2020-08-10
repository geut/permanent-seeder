const BaseCommand = require('../../base-command')

const KeyCommand = require('.')

class GetCommand extends KeyCommand {
  async run () {
    const { args: { key } } = this.parse(GetCommand)

    const result = await (key ? this.keysDatabase.get(key) : this.keysDatabase.getAll())

    if (!result) {
      this.log('Key not present')
      return
    }

    this.log(JSON.stringify(result, null, 2))
  }
}

GetCommand.description = 'Shows a key entry'

GetCommand.args = [
  { name: 'key', description: 'Key to show\nIf not present shows all config entries' }
]

GetCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = GetCommand
