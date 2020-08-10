const { promisify } = require('util')

const pm2 = require('pm2')

module.exports.pm2Connect = promisify(pm2.connect.bind(pm2))
module.exports.pm2Disconnect = promisify(pm2.disconnect.bind(pm2))
module.exports.pm2Start = promisify(pm2.start.bind(pm2))
module.exports.pm2Stop = promisify(pm2.stop.bind(pm2))
module.exports.pm2Restart = promisify(pm2.restart.bind(pm2))
module.exports.pm2List = promisify(pm2.list.bind(pm2))
module.exports.pm2SendDataToProcessId = promisify(pm2.sendDataToProcessId.bind(pm2))
