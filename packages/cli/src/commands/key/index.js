const { flags } = require('@oclif/command')

const { KeysDatabase } = require('@geut/permanent-seeder-database')

const BaseCommand = require('../../base-command')

class KeyCommand extends BaseCommand {
  get dbPath () {
    return this._dbPath
  }

  get keysDatabase () {
    return this._keysDatabase
  }

  async init () {
    const { flags: { dbPath } } = this.parse(KeyCommand)

    this._dbPath = dbPath || await this.getConfig('keys.db.path')
    this._keysDatabase = new KeysDatabase(this._dbPath)
  }

  async run () {
    this._help()
  }
}

KeyCommand.description = 'Keys commands'

// KeyCommand.usage = ['key:[add|get|update|remove|stream]']

KeyCommand.flags = {
  dbPath: flags.string({ description: 'Path to keys database' })
}

KeyCommand.strict = false

module.exports = KeyCommand
