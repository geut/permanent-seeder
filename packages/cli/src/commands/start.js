const { Command, flags } = require('@oclif/command')
const seeder = require('@geut/seeder');

class StartCommand extends Command {
  async run() {
    const { flags } = this.parse(StartCommand)

    const keys = require('../../keys.json');

    this.log(JSON.stringify(keys, null, 2));

    seeder();
  }
}

StartCommand.description = `Describe the command here
...
Extra documentation goes here
`

StartCommand.flags = {
  name: flags.string({ char: 'n', description: 'name to print' }),
}

module.exports = StartCommand
