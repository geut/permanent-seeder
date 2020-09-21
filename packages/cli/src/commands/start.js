const { resolve } = require('path')

const { flags } = require('@oclif/command')

const BaseCommand = require('../base-command')
const { pm2Connect, pm2List, pm2Start, pm2Disconnect, pm2Stop, pm2Delete } = require('../pm2-async')
const { SEEDER_DAEMON } = require('../constants')

class StartCommand extends BaseCommand {
  async run () {
    const { flags: { restart } } = this.parse(StartCommand)

    try {
      await pm2Connect()

      const runningProcesses = await pm2List()
      const daemonProcess = runningProcesses.find(proc => proc.name === SEEDER_DAEMON)
      const status = daemonProcess && daemonProcess.pm2_env.status

      if (status !== 'online') {
        await this.start()
      } else if (restart) {
        await this.restart()
      } else {
        const error = new Error('Permanent Seeder daemon already running. Use --restart to force')
        error.code = 'DAEMON_RUNNING'
        throw error
      }
    } catch (error) {
      this.error(error.message || error.toString())
      return
    } finally {
      await pm2Disconnect()
    }
  }

  async restart () {
    try {
      await this.stop()
      await pm2Delete(SEEDER_DAEMON)
    } catch (error) {
      this.error(error)
    }

    await this.start()
  }

  async start () {
    this.startTask('Starting')

    try {
      const config = this.checkConfig()

      const args = [JSON.stringify(config)]

      await pm2Start({
        name: SEEDER_DAEMON,
        script: resolve(__dirname, '..', 'seeder-daemon'),
        args,
        output: resolve(config.path, 'logs', 'output.log'),
        error: resolve(config.path, 'logs', 'error.log'),
        wait_ready: true,
        listen_timeout: 5000,
        max_memory_restart: '1024M',
        force: true
      })
    } catch (error) {
      this.error(error)
    }

    await this.stopTask()
  }

  async stop () {
    this.startTask('Stopping')

    try {
      await pm2Stop(SEEDER_DAEMON)
    } catch (error) {
      this.error(error)
    }

    await this.stopTask()
  }
}

StartCommand.description = 'Start permanent seeder daemon'

StartCommand.flags = {
  restart: flags.boolean({ default: false, description: 'Restart daemon if running' })
}

module.exports = StartCommand
