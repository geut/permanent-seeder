const Seeder = require('./seeder')

const main = async () => {
  const s = new Seeder()
  await s.seed(['2a09008a55c8f4bcc14987ed43331675611a2b506859ebfdd050b0f41746ad02'])
  s.on('drive-progress', (...args) => console.log('progress', args))
  s.on('drive-finish', async (dkey, ...args) => {
    console.log('finish download', dkey)
    console.log(`Content available in: ${s.opts.storageLocation}`)
    const stats = await s.allStats()
    console.log('stats')
    for (const s of stats) {
      console.log(s.core)
    }
  })
}

main().catch(err => {
  console.error(err)
})
