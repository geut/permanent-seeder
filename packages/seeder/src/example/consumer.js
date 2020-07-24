const P2PCommons = require('@p2pcommons/sdk-js')
const tempy = require('tempy')

const baseDir = tempy.directory()
console.log(`baseDir is: ${baseDir}`)

const commons = new P2PCommons({ verbose: true, baseDir })

process.once('SIGINT', () => commons.destroy())

const consumer = async () => {
  // GOAL: the sdk will clone the module key

  const externalContentUrl = process.argv[2]
  const externalContentVersion = process.argv[3] // optional, module version for checkouts
  if (!externalContentUrl) {
    throw new Error('missing argument: module key')
  }

  console.log(`cloning module key ${externalContentUrl}`)
  const { rawJSON: content, dwldHandle } = await commons.clone(
    externalContentUrl,
    externalContentVersion
  )

  await new Promise(resolve => {
    // this can be also a put-end event if the SDK is in watch mode
    dwldHandle.on('end', () => {
      return resolve()
    })
  })

  console.log('content downloaded OK')
  console.log({ content })

  await commons.destroy()
}

consumer().catch(err => {
  console.error(err)
  process.exit(1)
})
