const { cli } = require('cli-ux')

const KeyCommand = require('.')

const BaseCommand = require('../../base-command')

class RemoveCommand extends KeyCommand {
  async run () {
    if (await cli.confirm('Are you sure?')) {
      if (await cli.confirm('Really?')) {
        const keys = await this.keysDatabase.getAll()

        for await (const { key } of keys) {
          await this.keysDatabase.remove(key)
        }

        this.log('Keys removed')
      }
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
