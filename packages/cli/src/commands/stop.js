const pify = require('pify')
const pm2 = require('pm2')

const { SEEDER_DAEMON } = require('./start')

const BaseCommand = require('../base-command')

const pm2Connect = pify(pm2.connect.bind(pm2))
const pm2Disconnect = pify(pm2.disconnect.bind(pm2))
const pm2Stop = pify(pm2.stop.bind(pm2))

class StopCommand extends BaseCommand {
  async run () {
    await pm2Connect()

    await pm2Stop(SEEDER_DAEMON)

    await pm2Disconnect()
  }
}

StopCommand.description = 'Stop permanent seeder daemon'

module.exports = StopCommand
