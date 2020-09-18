require('colors')

const { cli } = require('cli-ux')
const humanizeDuration = require('humanize-duration')
const prettyBytes = require('pretty-bytes')
const { flags } = require('@oclif/command')

const BaseCommand = require('../base-command')
const { pm2Connect, pm2List, pm2Disconnect, pm2Describe } = require('../pm2-async')
const { SEEDER_DAEMON } = require('../constants')

class StatusCommand extends BaseCommand {
  statusColor (status) {
    const statusStr = ` ${status.toUpperCase()} `.bold
    switch (status) {
      case 'online':
        return statusStr.bgGreen.black
      case 'stopped':
        return statusStr.bgWhite.black
      case 'launching':
        return statusStr.bgCyan.white
      case 'errored':
        return statusStr.bgRed.white
      case 'stopping':
      default:
        return statusStr.bgYellow.black
    }
  }

  getValueIfRunning (getValue) {
    return function (data) {
      if (data.pm2_env.status === 'online') {
        return getValue(data)
      }

      return ''
    }
  }

  async logStatus () {
    const { flags } = this.parse(StatusCommand)

    try {
      await pm2Connect()

      const runningProcesses = await pm2List()
      const daemonProcess = runningProcesses.find(proc => proc.name === SEEDER_DAEMON)

      if (!daemonProcess) {
        const error = new Error('Daemon is not running')
        error.code = 'DAEMON_NOT_RUNNING'
        throw error
      }

      const data = await pm2Describe(SEEDER_DAEMON)

      this.log('')
      cli.table(data, {
        status: {
          get: row => this.statusColor(row.pm2_env.status),
          minWidth: '20'
        },
        pid: {
          header: 'PID',
          get: this.getValueIfRunning(data => data.pid),
          minWidth: '10'
        },
        uptime: {
          get: this.getValueIfRunning(data => humanizeDuration(Date.now() - data.pm2_env.pm_uptime, { largest: 2, round: true })),
          minWidth: '30'
        },
        memory: {
          get: this.getValueIfRunning(data => prettyBytes(data.monit.memory)),
          minWidth: '10'
        },
        cpu: {
          get: this.getValueIfRunning(data => `${data.monit.cpu}%`),
          minWidth: '10'
        },
        instances: {
          get: this.getValueIfRunning(data => data.pm2_env.instances),
          minWidth: '10'
        }
      }, {
        ...flags // parsed flags
      })
      this.log('')
    } catch (error) {
      if (error.code === 'DAEMON_NOT_RUNNING') {
        this.warn(error.message)
      } else {
        this.error(error)
      }
    } finally {
      await pm2Disconnect()
    }
  }

  async run () {
    const { flags: { live } } = this.parse(StatusCommand)

    live && console.clear()

    await this.logStatus()

    if (live) {
      return setInterval(async () => {
        console.clear()
        await this.logStatus()
      }, 5000)
    }
  }
}

StatusCommand.description = 'Show Permanent Seeder status'

StatusCommand.flags = {
  ...cli.table.flags(),
  live: flags.boolean({ default: false, description: 'Show status every 5 seconds' })
}

module.exports = StatusCommand
