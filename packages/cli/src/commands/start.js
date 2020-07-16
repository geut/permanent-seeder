const { spawn } = require('child_process')

const { resolve } = require('path')

const { flags } = require('@oclif/command')

const BaseCommand = require('../base-command')

class StartCommand extends BaseCommand {
  async run () {
    const config = this.getConfig()
    const { flags: { repl } } = this.parse(StartCommand)

    const daemon = spawn(
      resolve(__dirname, '..', 'seeder-daemon'),
      [
        JSON.stringify(config),
        repl && 'repl'
      ]
    )

    daemon.stdout.pipe(process.stdout)
    daemon.stderr.pipe(process.stderr)
    process.stdin.pipe(daemon.stdin)

    daemon.on('close', process.exit)
  }
}

StartCommand.description = 'Start permanent seeder daemon'

StartCommand.flags = {
  repl: flags.boolean({ default: false, description: 'Interactive' })
}

module.exports = StartCommand
