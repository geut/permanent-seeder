
// jest.mock('../src/config', () => {
//   const moduleMock = jest.requireActual('../src/config')
//   const { join, resolve } = require('path')
//   const { readFileSync } = require('fs')
//   const lodashGet = require('lodash.get')
//   const tomlParse = require('@iarna/toml/parse')
//   const tempy = require('tempy')

//   const tmpDir = tempy.directory()

//   return {
//     ...moduleMock,
//     get: (key, options = {}) => {
//       const CONFIG_FILENAME = 'permanent-seeder.toml'
//       const getConfigFileContent = (folderPath) => {
//         const filePath = resolve(join(folderPath, CONFIG_FILENAME))
//         let content
//         try {
//           content = readFileSync(filePath, { encoding: 'utf-8' })
//         } catch (error) {}

//         return content
//       }

//       const getConfig = (folderPath, fallbackValue) => {
//         const content = getConfigFileContent(folderPath)

//         return content ? tomlParse(content) : (fallbackValue !== undefined ? fallbackValue : {})
//       }

//       const localConfig = getConfig(tmpDir)

//       if (key) {
//         return lodashGet(localConfig, key)
//       }

//       return localConfig
//     },
//     tmpDir
//   }
// })

// const config = require('../src/config')

const { promises: { rmdir } } = require('fs')
const { randomBytes } = require('crypto')

const { encode } = require('dat-encoding')
const tempy = require('tempy')

const ConfigInitCommand = require('../src/commands/config/init')
const StartCommand = require('../src/commands/start')
const StopCommand = require('../src/commands/stop')
const AddCommand = require('../src/commands/key/add')
const RemoveCommand = require('../src/commands/key/remove')
const GetCommand = require('../src/commands/key/get')

jest.setTimeout(30000)

let cwd
let result
const insertedKeys = []

// Mock process cwd
process.cwd = () => cwd

async function addKey (
  key = randomBytes(32).toString('hex'),
  title = `key-${Date.now()}`
) {
  await AddCommand.run([`-k=${key}`, `-t=${title}`])
  expect(result[0]).toContain('Key added!')

  return { key, title }
}

beforeAll(async () => {
  cwd = tempy.directory()
  await ConfigInitCommand.run([])
  await StartCommand.run(['--restart'])
})

afterAll(async () => {
  await StopCommand.run([])
  await rmdir(cwd, { recursive: true })
}, 10000)

beforeEach(async () => {
  result = []
  jest
    .spyOn(process.stdout, 'write')
    .mockImplementation(val => {
      result.push(val)
    })
})

afterEach(() => jest.restoreAllMocks())

describe('Test Commands', () => {
//   let result
//   beforeAll(async () => {
//     // NOTE(dk): we need a way to pass a custom directory for testing
//     // We can pass a custom dir to config.init
//     // but the config.get command is merging two totally different configs
//     await StopCommand.run([])
//     await ConfigInitCommand.run([`-t=${config.tmpDir}`])
//     await StartCommand.run(['--restart'])
//   })

  it('Add: should work with key and title', async () => {
    const { key, title } = await addKey()
    insertedKeys.push({ key, title })
  })

  it('Add: should work with prefixed key and title', async () => {
    const insertedKey = randomBytes(32).toString('hex')
    const key = `hyper://${insertedKey}`
    const title = 'test 2'

    await addKey(key, title)

    insertedKeys.push({ key: insertedKey, title })
  })

  it('get: key', async () => {
    const { key, title } = insertedKeys[1]

    await GetCommand.run([key])

    const expected = {
      key,
      title
    }

    expect(result[0]).toContain(JSON.stringify(expected, null, 2))
  })

  it('get: use prefix', async () => {
    const { key, title } = insertedKeys[0]
    const prefixedKey = `hyper://${key}`

    await GetCommand.run([prefixedKey])

    const expected = {
      key: encode(prefixedKey),
      title
    }

    expect(result[0]).toContain(JSON.stringify(expected, null, 2))
  })

  it('get: all', async () => {
    await GetCommand.run([])

    expect(result[0]).toContain(JSON.stringify(insertedKeys, null, 2))
  })

  test('remove: key', async () => {
    const { key } = insertedKeys[0]
    await RemoveCommand.run([key])

    expect(result[0]).toContain('Key removed')
  })

  test('remove: prefixed key', async () => {
    const { key } = insertedKeys[0]
    const prefixedKey = `hyper://${key}`
    await RemoveCommand.run([prefixedKey])
    expect(result[0]).toContain('Key removed')
  })
})
