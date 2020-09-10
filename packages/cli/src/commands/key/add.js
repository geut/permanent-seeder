const { encode } = require('dat-encoding')

const { sendMessage } = require('../../pm2-async')
const BaseCommand = require('../../base-command')
const { SEEDER_DAEMON, MESSAGE_KEY_ADD } = require('../../constants')

const KeyCommand = require('.')

class AddCommand extends KeyCommand {
  async run () {
    const { args: { key } } = this.parse(AddCommand)

    try {
      await sendMessage(SEEDER_DAEMON, MESSAGE_KEY_ADD, { key })
    } catch (error) {
      this.error(error.message)
    }

    this.log('Key added!')
    process.exit(0)
  }
}

AddCommand.description = 'Adds a key to be persisted'

AddCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

AddCommand.args = [
  { name: 'key', parse: key => encode(key), description: 'Key to add' }
]

module.exports = AddCommand
