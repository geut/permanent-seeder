const { promises: { rmdir } } = require('fs')
const { randomBytes } = require('crypto')

const tempy = require('tempy')

const ConfigInitCommand = require('../src/commands/config/init')
const AddCommand = require('../src/commands/key/add')
const StartCommand = require('../src/commands/start')
const StopCommand = require('../src/commands/stop')

let cwd
let result

// Mock process cwd
process.cwd = () => cwd

beforeAll(async () => {
  cwd = tempy.directory()
  await ConfigInitCommand.run([])
  await StartCommand.run([])
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

describe('Config commands (cwd)', () => {
  it('Add: should work with key and title', async () => {
    const key = randomBytes(32).toString('hex')
    const title = 'test'
    await AddCommand.run([`-k=${key}`, `-t=${title}`])
    expect(result[0]).toContain('Key added!')
  })
})
