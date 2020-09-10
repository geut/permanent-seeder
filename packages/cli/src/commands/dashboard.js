const BaseCommand = require('../base-command')
const { cli } = require('cli-ux')

class DashboardCommand extends BaseCommand {
  async run () {
    await cli.open('http://localhost:3001/')
  }
}

DashboardCommand.description = 'Open the Permanent Seeder dashboard in the browser'

module.exports = DashboardCommand
