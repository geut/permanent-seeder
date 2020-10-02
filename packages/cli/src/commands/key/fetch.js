const { sendMessage } = require('../../pm2-async')
const BaseCommand = require('../../base-command')
const { SEEDER_DAEMON, MESSAGE_KEY_FETCH } = require('../../constants')

const KeyCommand = require('.')

class AddCommand extends KeyCommand {
  async run () {
    try {
      await sendMessage(SEEDER_DAEMON, MESSAGE_KEY_FETCH)
    } catch (error) {
      this.error(error.message)
    }

    this.log('Keys fetched!')
    process.exit(0)
  }
}

AddCommand.description = 'Adds a key to be persisted'

AddCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = AddCommand
