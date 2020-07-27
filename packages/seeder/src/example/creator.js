const {
  promises: { writeFile }
} = require('fs')
const { join } = require('path')
const { once } = require('events')
const P2PCommons = require('@p2pcommons/sdk-js')
const tempy = require('tempy')

const commons = new P2PCommons({
  baseDir: tempy.directory(),
  verbose: true,
  persist: false
})
process.once('SIGINT', () => commons.destroy())
;(async () => {
  await commons.ready()
  // create some content
  const { rawJSON, driveWatch } = await commons.init({
    type: 'content',
    title: 'Cool 101',
    description: 'All the cool content you want to know'
  })
  const key = rawJSON.url.slice('hyper://'.length)
  console.log('key', key)

  await writeFile(join(commons.baseDir, key, 'file.txt'), 'hola mundo')

  await once(driveWatch, 'put-end')
  await commons.set({
    url: rawJSON.url,
    description: 'All the cool content you want to know and more!!!',
    main: 'file.txt'
  })
  const { rawJSON: updatedContent, metadata } = await commons.get(rawJSON.url)
  console.log({ metadata })
  console.log({ rawJSON: updatedContent })
  console.log('P2PCommons swarming listening...')
  commons.destroy(true, false)
})()
