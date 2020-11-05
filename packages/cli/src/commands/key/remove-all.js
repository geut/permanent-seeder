const { cli } = require('cli-ux')

const KeyCommand = require('.')

const { sendMessage } = require('../../pm2-async')
const { SEEDER_DAEMON, MESSAGE_SEEDER_UNSEED } = require('../../constants')
const BaseCommand = require('../../base-command')

class RemoveCommand extends KeyCommand {
  async run () {
    if (await cli.confirm('Are you sure?')) {
      const keys = await this.keysDatabase.getAll()

      for await (const { key } of keys) {
        await this.keysDatabase.remove(key)
        try {
          await sendMessage(SEEDER_DAEMON, MESSAGE_SEEDER_UNSEED, { key })
        } catch (error) {
          this.error(error.message)
        }
      }

      this.log('Keys removed')
    }

    this.exit(0)
  }
}

RemoveCommand.description = 'Removes all keys'

RemoveCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = RemoveCommand
