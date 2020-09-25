const BaseCommand = require('../base-command')
const { cli } = require('cli-ux')

class DashboardCommand extends BaseCommand {
  async run () {
    const config = this.checkConfig()

    const { api: { https, port = 3001 } = {} } = config

    const url = `http${https ? 's' : ''}://localhost:${port}/`

    try {
      await cli.open(url)
    } catch (_) {
      this.log(`Dashboard running in: ${url}`)
    }
  }
}

DashboardCommand.description = 'Open the Permanent Seeder dashboard in the browser'

module.exports = DashboardCommand
