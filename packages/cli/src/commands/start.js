const { resolve } = require('path')

const { flags } = require('@oclif/command')
const pify = require('pify')
const pm2 = require('pm2')

const ReplCommand = require('./repl')

const BaseCommand = require('../base-command')

export const SEEDER_DAEMON = 'seeder-daemon'

const pm2Connect = pify(pm2.connect.bind(pm2))
const pm2Disconnect = pify(pm2.disconnect.bind(pm2))
const pm2List = pify(pm2.list.bind(pm2))
const pm2Start = pify(pm2.start.bind(pm2))
const pm2Restart = pify(pm2.restart.bind(pm2))

class StartCommand extends BaseCommand {
  async run () {
    const config = this.getConfig()
    const { flags: { restart, repl } } = this.parse(StartCommand)

    try {
      await pm2Connect()

      const runningProcesses = await pm2List()
      const daemonProcess = runningProcesses.find(proc => proc.name === SEEDER_DAEMON)

      if (daemonProcess && daemonProcess.pm2_env.status === 'online') {
        if (restart) {
          await pm2Restart(SEEDER_DAEMON)
        } else {
          const error = new Error('Daemon already running. Use --restart to force')
          error.code = 'DAEMON_RUNNING'
          throw error
        }
      } else {
        const args = [JSON.stringify(config)]

        await pm2Start({
          name: SEEDER_DAEMON,
          script: resolve(__dirname, '..', SEEDER_DAEMON),
          args
        })

        if (repl) {
          await ReplCommand.run()
        }
      }
    } catch (error) {
      if (error.code === 'DAEMON_RUNNING') {
        this.error(error.message)
      }
    } finally {
      !repl && await pm2Disconnect()
    }
  }
}

StartCommand.description = 'Start permanent seeder daemon'

StartCommand.flags = {
  restart: flags.boolean({ default: false, description: 'Restart daemon if running' }),
  repl: flags.boolean({ default: false, description: 'Open repl after start' })
}

module.exports = StartCommand
