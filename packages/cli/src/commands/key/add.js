const { flags } = require('@oclif/command')

const { pm2SendDataToProcessId } = require('../../pm2-async')
const BaseCommand = require('../../base-command')

const KeyCommand = require('.')

class AddCommand extends KeyCommand {
  async run () {
    const { flags: { key, title } } = this.parse(AddCommand)

    try {
      await this.runOnDaemon(async daemonProcess => {
        await pm2SendDataToProcessId(daemonProcess.pm_id, {
          topic: 'keys:add',
          data: {
            key,
            title
          }
        })
      })
    } catch (error) {
      this.error(error.message)
    }

    this.log('Key added!')
    process.exit(0)
  }
}

AddCommand.description = 'Adds a key'

AddCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags,
  key: flags.string({ char: 'k', required: true, description: 'Key to add' }),
  title: flags.string({ char: 't', required: true, description: 'Key title' })
}

module.exports = AddCommand
