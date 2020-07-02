const { Command } = require('@oclif/command')
const seeder = require('@geut/seeder')

class StartCommand extends Command {
  async run () {
    const keys = require('../../keys.json')

    this.log(JSON.stringify(keys, null, 2))

    seeder()
  }
}

StartCommand.description = 'Start permanent seeder daemon'

// StartCommand.flags = {
//   name: flags.string({ char: 'n', description: 'name to print' })
// };

module.exports = StartCommand
