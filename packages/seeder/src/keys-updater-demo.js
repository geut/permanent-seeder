const KeysUpdater = require('./keys-updater')
const KeysDB = require('./keys-db')

const db = new KeysDB(`/tmp/${Date.now()}`)
const endpoint = 'http://localhost:3000'

const updater = new KeysUpdater(endpoint, db)

console.log('Keys endpoint:', endpoint)

setInterval(async () => {
  const newKeys = await updater.update()

  console.log('Added', newKeys.length, 'keys')
}, 5000)
