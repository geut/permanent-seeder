const { resolve } = require('path')
const { Command, flags } = require('@oclif/command')

const config = require('./config')

class BaseCommand extends Command {
  get localConfigFolderPath () {
    return resolve(process.cwd())
  }

  get globalConfigFolderPath () {
    return this.config.home
  }

  getConfig (key) {
    const configValues = config.get(key, {
      globalConfigFolderPath: this.globalConfigFolderPath,
      localConfigFolderPath: this.localConfigFolderPath
    })

    return configValues
  }

  log (msg, force = false) {
    const { flags } = this.parse(this.constructor)

    if (flags.verbose || force) {
      return super.log(msg)
    }
  }
}

BaseCommand.strict = false

BaseCommand.flags = {
  verbose: flags.boolean({ description: 'Log output', default: false })
}

module.exports = BaseCommand
