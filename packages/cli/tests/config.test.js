const { promises: { open, readFile, rmdir } } = require('fs')
const { join } = require('path')

const tomlParse = require('@iarna/toml/parse')
const tempy = require('tempy')

const ConfigInitCommand = require('../src/commands/config/init')

let cwd
let configFilePath

// Mock process cwd
process.cwd = () => cwd

async function checkCreatedFile () {
  const content = await readFile(configFilePath, { encoding: 'utf-8' })
  const config = tomlParse(content)

  expect(config.security.secret).toHaveLength(64)
  expect(config.keys.db.path).toBe(join(cwd, 'keys.db'))
  expect(config.metrics.db.path).toBe(join(cwd, 'metrics.db'))
  expect(config.vault.endpoint_url).toBe('http://localhost:3000')
  expect(config.vault.key_fetch_frequency).toBe(5)
}

beforeEach(async () => {
  cwd = tempy.directory()
  configFilePath = join(cwd, 'permanent-seeder.toml')
})

afterEach(async () => {
  await rmdir(cwd, { recursive: true })
})

describe('Config commands (cwd)', () => {
  it('Init: should create a .toml file', async () => {
    expect(() => open(configFilePath, 'r')).rejects.toBeTruthy()

    await ConfigInitCommand.run([])

    const fdPromise = open(configFilePath, 'r')
    expect(fdPromise).resolves.toBeTruthy()
    ;(await fdPromise).close()
  })

  it('Init: config should contain default values', async () => {
    await ConfigInitCommand.run([])

    await checkCreatedFile()
  })

  it('Init: throws an error if config already exists', async () => {
    expect(() => open(configFilePath, 'r')).rejects.toBeTruthy()

    await ConfigInitCommand.run([])

    const errorMessage = `Config file ${configFilePath} already exists.`

    await expect(() => ConfigInitCommand.run([])).rejects.toBeTruthy()

    try {
      await ConfigInitCommand.run([])
    } catch (error) {
      expect(error.message).toBe(errorMessage)
    }
  })

  it('Init: Override config using --force', async () => {
    expect(() => open(configFilePath, 'r')).rejects.toBeTruthy()

    await ConfigInitCommand.run([])

    let fdPromise = open(configFilePath, 'r')
    expect(fdPromise).resolves.toBeTruthy()
    ;(await fdPromise).close()

    await ConfigInitCommand.run(['--force'])

    fdPromise = open(configFilePath, 'r')
    expect(fdPromise).resolves.toBeTruthy()
    ;(await fdPromise).close()

    await checkCreatedFile()
  })
})
