const { KeysDB } = require('@geut/seeder')

const BaseCommand = require('../../base-command')

class KeyCommand extends BaseCommand {
  get dbPath () {
    return this._dbPath
  }

  get keysDB () {
    return this._keysDB
  }

  async init () {
    this._dbPath = await this.getConfig('keys.db.path')
    this._keysDB = new KeysDB(this._dbPath)
  }

  async run () {
    this._help()
  }
}

KeyCommand.usage = ['key:[add|get|update|remove]']

KeyCommand.description = 'Keys commands'

module.exports = KeyCommand
