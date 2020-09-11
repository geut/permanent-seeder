const { flags } = require('@oclif/command')

const config = require('../../config')
const BaseCommand = require('../../base-command')

const ConfigCommand = require('.')

class InitCommand extends ConfigCommand {
  async run () {
    const { flags: { force } } = this.parse(InitCommand)

    this.startTask('Creating initial configuration')

    config.init(this.configFolderPath, { force })

    this.stopTask()
  }

  async catch (error) {
    this.stopTask(false)

    if (error.code === 'EEXIST') {
      this.error(`Config file ${error.dest} already exists.`, { suggestions: ['Use --force to override.'] })
    } else {
      throw error
    }
  }
}

InitCommand.description = 'Creates default configuration'

InitCommand.flags = {
  force: flags.boolean({ char: 'f', description: 'Force', default: false }),
  ...ConfigCommand.flags,
  ...BaseCommand.flags
}

module.exports = InitCommand
