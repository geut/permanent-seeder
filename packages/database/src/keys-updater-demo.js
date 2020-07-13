const KeysUpdater = require('./keys-updater')
const KeysDB = require('./keys-database')

const dbPath = `/tmp/keys-${Date.now()}.db`
const db = new KeysDB(dbPath)
const endpoint = 'http://localhost:3000'

const updater = new KeysUpdater(endpoint, db)

console.log('DB Path:', dbPath)
console.log('Keys endpoint:', endpoint)

setInterval(async () => {
  const newKeys = await updater.update()

  console.clear()
  console.log('DB Path:', dbPath)
  console.log('Keys endpoint:', endpoint)
  console.log('\nAdded', newKeys.length, 'keys')
  console.log(JSON.stringify(newKeys.map(k => k.title), null, 2))
}, 5000)
