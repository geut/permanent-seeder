const del = require('del')

module.exports = async () => {
  await del(global.__cwd, { force: true })
}
