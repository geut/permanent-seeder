const { promisify } = require('util')

const pm2 = require('pm2')

const pm2Connect = promisify(pm2.connect.bind(pm2))
const pm2Describe = promisify(pm2.describe.bind(pm2))
const pm2Disconnect = promisify(pm2.disconnect.bind(pm2))
const pm2Kill = promisify(pm2.killDaemon.bind(pm2))
const pm2List = promisify(pm2.list.bind(pm2))
const pm2Restart = promisify(pm2.restart.bind(pm2))
const pm2SendDataToProcessId = promisify(pm2.sendDataToProcessId.bind(pm2))
const pm2Start = promisify(pm2.start.bind(pm2))
const pm2Stop = promisify(pm2.stop.bind(pm2))

async function sendMessage (processName, message, data) {
  await pm2Connect()

  let result

  const runningProcesses = await pm2List()
  const runningProcess = runningProcesses.find(proc => proc.name === processName)

  try {
    if (!runningProcess || runningProcess.pm2_env.status !== 'online') {
      const error = new Error('Daemon not running')
      error.code = 'DAEMON_NOT_RUNNING'
      throw error
    }

    result = await pm2SendDataToProcessId(runningProcess.pm2_env.pm_id, {
      topic: message,
      data
    })
  } finally {
    await pm2Disconnect()
  }

  return result
}

module.exports.pm2Connect = pm2Connect
module.exports.pm2Describe = pm2Describe
module.exports.pm2Disconnect = pm2Disconnect
module.exports.pm2Kill = pm2Kill
module.exports.pm2List = pm2List
module.exports.pm2Restart = pm2Restart
module.exports.pm2SendDataToProcessId = pm2SendDataToProcessId
module.exports.pm2Start = pm2Start
module.exports.pm2Stop = pm2Stop
module.exports.sendMessage = sendMessage
