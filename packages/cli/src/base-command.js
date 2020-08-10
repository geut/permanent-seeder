const { join, resolve } = require('path')

const { Command } = require('@oclif/command')

const config = require('./config')
const { pm2Connect, pm2List, pm2Disconnect } = require('./pm2-async')

const SEEDER_DAEMON = 'seeder-daemon'

class BaseCommand extends Command {
  get localConfigFolderPath () {
    return resolve(process.cwd())
  }

  get globalConfigFolderPath () {
    return join(this.config.home, 'permanent-seeder')
  }

  getConfig (key) {
    const configValues = config.get(key, {
      globalConfigFolderPath: this.globalConfigFolderPath,
      localConfigFolderPath: this.localConfigFolderPath
    })

    return configValues
  }

  async runOnDaemon (fn) {
    await pm2Connect()

    const runningProcesses = await pm2List()
    const daemonProcess = runningProcesses.find(proc => proc.name === SEEDER_DAEMON)

    try {
      if (!daemonProcess || daemonProcess.pm2_env.status !== 'online') {
        const error = new Error('Daemon not running')
        error.code = 'DAEMON_NOT_RUNNING'
        throw error
      }

      await fn(daemonProcess)
    } catch (error) {
      if (error.code === 'DAEMON_NOT_RUNNING') {
        this.error(error.message)
      }
    } finally {
      await pm2Disconnect()
    }
  }
}

BaseCommand.strict = false

module.exports = BaseCommand
