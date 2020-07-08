const { flags } = require('@oclif/command')

const KeyCommand = require('.')

const BaseCommand = require('../../base-command')

class AddCommand extends KeyCommand {
  async run () {
    const { flags: { key, title, createdAt } } = this.parse(AddCommand)

    const id = await this.keysDB.addKey({
      key,
      title,
      createdAt
    })

    this.log(`Key added with id: ${id}`, true)
  }
}

AddCommand.description = 'Add a key'

AddCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags,
  key: flags.string({ char: 'k', required: true, description: 'Key to add' }),
  title: flags.string({ char: 't', required: true, description: 'Key title' }),
  createdAt: flags.string({ char: 'c', required: true, description: 'Key creation date' })
}

module.exports = AddCommand
