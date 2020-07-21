const { SDK } = require('@geut/permanent-seeder-sdk')

const BaseCommand = require('../base-command')

class ReplCommand extends BaseCommand {
  async run () {
    const sdk = new SDK()
    await sdk.connect('repl')
    sdk.repl()
  }
}

ReplCommand.description = 'Start permanent seeder repl'

module.exports = ReplCommand
