const { flags } = require('@oclif/command')
const { encode } = require('dat-encoding')

const { pm2SendDataToProcessId } = require('../../pm2-async')
const BaseCommand = require('../../base-command')

const KeyCommand = require('.')

const MESSAGE_TOPIC_KEY_ADD = 'keys:add'

class AddCommand extends KeyCommand {
  async run () {
    const { flags: { key, title } } = this.parse(AddCommand)

    await this.runOnDaemon(async daemonProcess => {
      try {
        await pm2SendDataToProcessId(daemonProcess.pm_id, {
          topic: MESSAGE_TOPIC_KEY_ADD,
          data: {
            key,
            title
          }
        })
      } catch (error) {
        this.error(error.message)
      }
    })

    this.log('Key added!')
  }
}

AddCommand.description = 'Adds a key to be persisted'

AddCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags,
  key: flags.string({ char: 'k', parse: key => encode(key), required: true, description: 'Key to add' }),
  title: flags.string({ char: 't', required: true, description: 'Key title' })
}

module.exports = AddCommand
