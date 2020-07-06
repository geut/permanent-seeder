const { flags } = require('@oclif/command')

const config = require('../../config')
const BaseCommand = require('../../base-command')

const ConfigCommand = require('.')

class InitCommand extends ConfigCommand {
  async run () {
    const { flags: { global, force } } = this.parse(InitCommand)
    const configFolderPath = global ? this.globalConfigFolderPath : this.localConfigFolderPath

    await config.init(configFolderPath, { force })
  }

  async catch (error) {
    if (error.code === 'EEXIST') {
      this.error(`Config file ${error.dest} already exists.`, { suggestions: ['Use --force to override.'] })
    } else {
      throw error
    }
  }
}

InitCommand.description = 'Creates a default config file'

InitCommand.flags = {
  force: flags.boolean({ char: 'f', description: 'Force', default: false }),
  ...ConfigCommand.flags,
  ...BaseCommand.flags
}

module.exports = InitCommand
