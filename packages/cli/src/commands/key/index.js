const { resolve } = require('path')

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

    this._dbPath = dbPath

    if (!this._dbPath) {
      const path = await this.getConfig('path')
      const keysDbPath = resolve(path, 'keys.db')
      this._dbPath = keysDbPath
    }

    this._keysDatabase = new KeysDatabase(this._dbPath)
  }

  run () {
    this._help()
  }
}

KeyCommand.description = 'Keys commands'

KeyCommand.flags = {
  dbPath: flags.string({ description: 'Path to keys database' })
}

KeyCommand.strict = false

module.exports = KeyCommand
