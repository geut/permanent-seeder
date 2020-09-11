const { homedir } = require('os')
const { join } = require('path')
const { promises: { readFile } } = require('fs')

const { flags } = require('@oclif/command')

const Tail = require('tail').Tail

const BaseCommand = require('../base-command')

class TailCommand extends BaseCommand {
  async run () {
    const { flags: { error, live, all } } = this.parse(TailCommand)

    const file = join(homedir(), `.pm2/logs/seeder-daemon-${error ? 'error' : 'out'}.log`)

    if (!live) {
      const data = await readFile(file, 'utf8')
      console.log(data)
      process.exit(0)
    }

    const tail = new Tail(file, { fromBeginning: all, flushAtEOF: true })

    tail.on('line', function (data) {
      console.log(data)
    })
  }
}

TailCommand.description = 'Show logs'

TailCommand.flags = {
  error: flags.boolean({ default: false, description: 'Show error logs' }),
  live: flags.boolean({ default: false, description: 'Keep logs live' }),
  all: flags.boolean({ default: false, description: 'Show logs from beginning' })
}

module.exports = TailCommand
