const KeyCommand = require('.')

const BaseCommand = require('../../base-command')

class RemoveCommand extends KeyCommand {
  async run () {
    const { args: { key } } = this.parse(RemoveCommand)

    await this.keysDatabase.remove(key)

    this.log('Key removed')
  }
}

RemoveCommand.description = 'Removes a key'

RemoveCommand.args = [
  { name: 'key', required: true, description: 'Key to remove' }
]

RemoveCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = RemoveCommand
