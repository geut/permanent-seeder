const KeyCommand = require('.')
const { encode } = require('dat-encoding')

const { sendMessage } = require('../../pm2-async')
const { SEEDER_DAEMON, MESSAGE_SEEDER_UNSEED } = require('../../constants')
const BaseCommand = require('../../base-command')

class RemoveCommand extends KeyCommand {
  async run () {
    const { args: { key } } = this.parse(RemoveCommand)

    await this.keysDatabase.remove(key)
    try {
      await sendMessage(SEEDER_DAEMON, MESSAGE_SEEDER_UNSEED, { key })
    } catch (error) {
      this.error(error.message)
    }

    this.log('Key removed')
  }
}

RemoveCommand.description = 'Removes a key'

RemoveCommand.args = [
  { name: 'key', parse: key => encode(key), required: true, description: 'Key to remove' }
]

RemoveCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = RemoveCommand
