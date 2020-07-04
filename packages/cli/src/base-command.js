const { Command, flags } = require('@oclif/command')

class BaseCommand extends Command {
  log (msg, force = false) {
    const { flags } = this.parse(this.constructor)

    if (flags.verbose || force) {
      return super.log(msg)
    }
  }
}

BaseCommand.flags = {
  verbose: flags.boolean({ description: 'Log output', default: false })
}

module.exports = BaseCommand
