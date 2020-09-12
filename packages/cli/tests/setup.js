const os = require('os')

const tempy = require('tempy')

const { pm2Kill } = require('../src/pm2-async')

module.exports = async () => {
  await pm2Kill()

  global.__cwd = tempy.directory({ prefix: 'permanent-seeder-tests-' })

  process.chdir(global.__cwd)

  os.homedir = () => {
    return global.__cwd
  }
}
