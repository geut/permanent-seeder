
const { resolve } = require('path')
const { createReadStream } = require('fs')
const { Transform } = require('readable-stream')

const { flags } = require('@oclif/command')
const PinoPretty = require('pino-pretty')

const Tail = require('tail').Tail

const BaseCommand = require('../base-command')

class TailCommand extends BaseCommand {
  async run () {
    const { flags: { error, live, all } } = this.parse(TailCommand)

    const config = this.checkConfig()

    const file = resolve(config.path, 'logs', `${error ? 'error' : 'output'}.log`)
    const stream = createReadStream(file, 'utf8')

    const pinoPretty = PinoPretty({
      colorize: true,
      translateTime: true,
      ignore: 'nodeID,ns',
      search: !error ? 'level < `40`' : undefined // Ignore higher levels than info (30)
    })

    const pinoPrettyTransformer = new Transform({
      transform (chunk, enc, callback) {
        chunk
          .toString()
          .split('\n')
          .map((data = '') => data && this.push(pinoPretty(data)))
        callback()
      }
    })

    if (!live) {
      stream
        .pipe(pinoPrettyTransformer)
        .pipe(process.stdout)
        .on('end', () => process.exit(0))

      return
    }

    const tail = new Tail(file, { fromBeginning: all, flushAtEOF: true })

    tail.on('line', function (data) {
      process.stdout.write(pinoPretty(data))
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
