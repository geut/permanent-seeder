const KeyCommand = require('.')

const BaseCommand = require('../../base-command')

class RemoveCommand extends KeyCommand {
  async run () {
    const { args: { id } } = this.parse(RemoveCommand)

    await this.keysDB.removeKey(id)

    this.log('Key removed', true)
  }
}

RemoveCommand.description = 'Remove a key'

RemoveCommand.args = [
  { name: 'id', required: true, description: 'Key id to remove' }
]

RemoveCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = RemoveCommand
