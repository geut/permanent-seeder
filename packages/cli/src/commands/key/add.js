const { flags } = require('@oclif/command')

const KeyCommand = require('.')

const BaseCommand = require('../../base-command')

class AddCommand extends KeyCommand {
  async run () {
    const { flags: { key, title } } = this.parse(AddCommand)

    await this.keysDatabase.add({
      key,
      title
    })

    this.log('Key added!')
  }
}

AddCommand.description = 'Adds a key'

AddCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags,
  key: flags.string({ char: 'k', required: true, description: 'Key to add' }),
  title: flags.string({ char: 't', required: true, description: 'Key title' })
}

module.exports = AddCommand
