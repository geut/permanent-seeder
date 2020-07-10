const Seeder = require('./')

const main = async () => {
  const s = new Seeder()
  await s.seed(['aa27834b41fa78c091ddb066e889202775bb3b5f57586c69d709be9f7231fccf'])
  s.on('drive-progress', (...args) => console.log('progress', args))
  s.on('drive-finish', (dkey, ...args) => {
    console.log('finish download', dkey)
    console.log(`Content available in: ${s.opts.storageLocation}`)
  })
}

main().catch(err => {
  console.error(err)
})
