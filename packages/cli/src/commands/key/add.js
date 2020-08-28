const { flags } = require('@oclif/command')
const { encode } = require('dat-encoding')

const { sendMessage } = require('../../pm2-async')
const BaseCommand = require('../../base-command')

const KeyCommand = require('.')

const MESSAGE_KEY_ADD = 'keys:add'
const SEEDER_DAEMON = 'seeder-daemon'

class AddCommand extends KeyCommand {
  async run () {
    const { flags: { key, title } } = this.parse(AddCommand)

    try {
      await sendMessage(SEEDER_DAEMON, MESSAGE_KEY_ADD, { key, title })
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
  ...BaseCommand.flags,
  key: flags.string({ char: 'k', parse: key => encode(key), required: true, description: 'Key to add' }),
  title: flags.string({ char: 't', required: true, description: 'Key title' })
}

module.exports = AddCommand
