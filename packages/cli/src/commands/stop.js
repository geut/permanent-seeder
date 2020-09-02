const BaseCommand = require('../base-command')
const { SEEDER_DAEMON } = require('../constants')
const { pm2Connect, pm2Stop, pm2Disconnect } = require('../pm2-async')

class StopCommand extends BaseCommand {
  async run () {
    try {
      await pm2Connect()

      await pm2Stop(SEEDER_DAEMON)

      await pm2Disconnect()
    } catch (error) {
      this.error(error)
    }
  }
}

StopCommand.description = 'Stop permanent seeder daemon'

module.exports = StopCommand
