const { randomBytes } = require('crypto')

const { encode } = require('dat-encoding')
const tempy = require('tempy')
const del = require('del')
const { mockProcessExit } = require('jest-mock-process')

const ConfigInitCommand = require('../src/commands/config/init')
const StartCommand = require('../src/commands/start')
const StopCommand = require('../src/commands/stop')
const AddCommand = require('../src/commands/key/add')
const RemoveCommand = require('../src/commands/key/remove')
const GetCommand = require('../src/commands/key/get')

jest.setTimeout(10000)

let cwd
let result
let mockExit
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
  await del(cwd, { force: true })
})

beforeEach(async () => {
  result = []

  mockExit = mockProcessExit()

  jest
    .spyOn(process.stdout, 'write')
    .mockImplementation(val => {
      result.push(val)
    })
})

afterEach(() => {
  mockExit.mockRestore()
  jest.restoreAllMocks()
})

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

  it('remove: key', async () => {
    const { key } = insertedKeys[0]
    await RemoveCommand.run([key])

    expect(result[0]).toContain('Key removed')
  })

  it('remove: prefixed key', async () => {
    const { key } = insertedKeys[0]
    const prefixedKey = `hyper://${key}`
    await RemoveCommand.run([prefixedKey])
    expect(result[0]).toContain('Key removed')
  })
})
