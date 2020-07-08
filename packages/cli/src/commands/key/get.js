const BaseCommand = require('../../base-command')

const KeyCommand = require('.')

class GetCommand extends KeyCommand {
  async run () {
    const { args: { id } } = this.parse(GetCommand)

    const result = await (id ? this.keysDB.getKey(id) : this.keysDB.getKeys())

    if (!result) {
      this.log('Key not present', true)
      return
    }

    this.log(JSON.stringify(result, null, 2), true)
  }
}

GetCommand.description = 'Shows a key entry based on id'

GetCommand.args = [
  { name: 'id', description: 'Key id to show\nIf not present shows all config entries' }
]

GetCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = GetCommand
