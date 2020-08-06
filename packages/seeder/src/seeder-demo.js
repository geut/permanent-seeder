const Seeder = require('./seeder')

const main = async () => {
  const s = new Seeder()
  await s.seed(['98e3f6def8fc945a24e7aea241a69a4270ff65091f1aa54946baeeb30f92bd2e'])

  console.log(`Content available in: ${s.opts.storageLocation}`)

  s.on('drive-upload', (...args) => console.log('progress', args))
  s.on('drive-download', async (key, ...args) => {
    if (!key) return

    const stat = await s.stat(key.toString('hex'))
    console.dir({ stat })
  })
}

main().catch(err => {
  console.error(err)
})
