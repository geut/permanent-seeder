const { randomBytes } = require('crypto')

const { encode } = require('dat-encoding')
const { mockProcessExit } = require('jest-mock-process')

const ConfigInitCommand = require('../src/commands/config/init')
const StartCommand = require('../src/commands/start')
const StopCommand = require('../src/commands/stop')
const AddCommand = require('../src/commands/key/add')
const RemoveCommand = require('../src/commands/key/remove')
const GetCommand = require('../src/commands/key/get')

jest.setTimeout(10000)

let result
let mockExit
const insertedKeys = []

async function addKey (key = randomBytes(32).toString('hex')) {
  await AddCommand.run([key])

  expect(result[0]).toContain('Key added!')

  return key
}

beforeAll(async () => {
  await ConfigInitCommand.run([])

  await StartCommand.run(['--restart'])

  // Wait for start complete
  await new Promise(resolve => setTimeout(resolve, 2000))
})

afterAll(async () => {
  await StopCommand.run([])
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
  it('Add: should work with key', async () => {
    const key = await addKey()
    insertedKeys.push({ key })
  })

  it('Add: should work with prefixed key', async () => {
    const insertedKey = randomBytes(32).toString('hex')
    const key = `hyper://${insertedKey}`

    await addKey(key)

    insertedKeys.push({ key: insertedKey })
  })

  it('get: key', async () => {
    const { key } = insertedKeys[1]

    await GetCommand.run([key])

    const expected = {
      key
    }

    expect(JSON.parse(result[0])).toStrictEqual(expected)
  })

  it('get: use prefix', async () => {
    const { key } = insertedKeys[0]
    const prefixedKey = `hyper://${key}`

    await GetCommand.run([prefixedKey])

    const expected = {
      key: encode(prefixedKey)
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
