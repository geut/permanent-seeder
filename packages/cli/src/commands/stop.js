const BaseCommand = require('../base-command')
const { SEEDER_DAEMON } = require('../constants')
const { pm2Connect, pm2Stop, pm2Disconnect } = require('../pm2-async')

class StopCommand extends BaseCommand {
  async run () {
    try {
      this.startTask('Checking status')

      await pm2Connect()

      await pm2Stop(SEEDER_DAEMON)

      await this.stopTask()
    } catch (error) {
      if (error.message !== 'process or namespace not found') {
        await this.stopTask(false)
        this.error(error)
      } else {
        await this.stopTask()
      }
    } finally {
      await pm2Disconnect()
    }
  }
}

StopCommand.description = 'Stop permanent seeder daemon'

module.exports = StopCommand
