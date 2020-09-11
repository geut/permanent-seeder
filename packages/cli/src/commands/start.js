const { resolve } = require('path')

const { flags } = require('@oclif/command')

const ReplCommand = require('./repl')

const BaseCommand = require('../base-command')
const { pm2Connect, pm2List, pm2Restart, pm2Start, pm2Disconnect } = require('../pm2-async')
const { SEEDER_DAEMON } = require('../constants')

class StartCommand extends BaseCommand {
  async run () {
    const config = this.getConfig()
    const { flags: { restart, repl, hot } } = this.parse(StartCommand)

    if (!config) {
      this.error('Config file not found.', { suggestions: ['Run config:init command to initialize.'] })
      return
    }

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

        if (hot) {
          args.push(true)
        }

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
  repl: flags.boolean({ default: false, description: 'Open repl after start' }),
  hot: flags.boolean({ default: false, description: 'Reload on change' })
}

module.exports = StartCommand
