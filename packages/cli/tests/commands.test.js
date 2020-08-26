
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

jest.setTimeout(10000)

let cwd
let result
const insertedKeys = []

async function addKey (
  key = randomBytes(32).toString('hex'),
  title = `key-${Date.now()}`
) {
  await AddCommand.run([`-k=${key}`, `-t=${title}`])
  expect(result[0]).toContain('Key added!')

  return { key, title }
}

beforeAll(async () => {
  cwd = tempy.directory({ prefix: 'permanent-seeder-tests-' })
  process.chdir(cwd)

  await ConfigInitCommand.run([])

  await StartCommand.run(['--restart'])

  // Wait for start complete
  await new Promise(resolve => setTimeout(resolve, 2000))
})

afterAll(async () => {
  await StopCommand.run([])
  await rmdir(cwd, { recursive: true })
})

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

    expect(JSON.parse(result[0])).toStrictEqual(expected)
  })

  it('get: use prefix', async () => {
    const { key, title } = insertedKeys[0]
    const prefixedKey = `hyper://${key}`

    await GetCommand.run([prefixedKey])

    const expected = {
      key: encode(prefixedKey),
      title
    }

    expect(JSON.parse(result[0])).toStrictEqual(expected)
  })

  it('get: all', async () => {
    await GetCommand.run([])

    const expected = JSON.parse(result[0])
    expected.sort((a, b) => a.key < b.key ? -1 : 1)
    insertedKeys.sort((a, b) => a.key < b.key ? -1 : 1)

    expect(expected).toHaveLength(2)
    expect(insertedKeys).toHaveLength(2)

    expect(expected).toEqual(insertedKeys)
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
