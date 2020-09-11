const os = require('os')

const tempy = require('tempy')

module.exports = async () => {
  global.__cwd = tempy.directory({ prefix: 'permanent-seeder-tests-' })

  process.chdir(global.__cwd)

  os.homedir = () => {
    return global.__cwd
  }
}
