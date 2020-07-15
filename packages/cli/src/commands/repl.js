const { spawn } = require('child_process')

const BaseCommand = require('../base-command')
const { resolve } = require('path')

class ReplCommand extends BaseCommand {
  async run () {
    const daemon = spawn(resolve(__dirname, '..', 'seeder-repl'))

    daemon.stdout.pipe(process.stdout)
    daemon.stderr.pipe(process.stderr)

    daemon.on('close', process.exit)

    process.stdin.pipe(daemon.stdin)
  }
}

ReplCommand.description = 'Start permanent seeder repl'

module.exports = ReplCommand
