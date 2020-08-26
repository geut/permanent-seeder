const { promises: { open, readFile } } = require('fs')
const { join } = require('path')

const tomlParse = require('@iarna/toml/parse')
const tempy = require('tempy')
const del = require('del')

const ConfigInitCommand = require('../src/commands/config/init')
const ConfigGetCommand = require('../src/commands/config/get')

function checkConfig (config) {
  expect(config.security.secret).toHaveLength(64)
  expect(config.keys.db.path).toBe(join(cwd, 'keys.db'))
  expect(config.metrics.db.path).toBe(join(cwd, 'metrics.db'))
  expect(config.vault.endpoint_url).toBe('http://localhost:3000')
  expect(config.vault.key_fetch_frequency).toBe(5)
}

let cwd
let configFilePath

async function checkCreatedFile () {
  const content = await readFile(configFilePath, { encoding: 'utf-8' })
  const config = tomlParse(content)

  checkConfig(config)
}

beforeEach(async () => {
  cwd = tempy.directory({ prefix: 'permanent-seeder-tests-' })
  process.chdir(cwd)
  configFilePath = join(cwd, 'permanent-seeder.toml')
})

afterEach(async () => {
  await del(cwd, { force: true })
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

  it('Config: get all config', async () => {
    await ConfigInitCommand.run([])

    let config
    jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(val => {
        config = JSON.parse(val)
      })

    await ConfigGetCommand.run([])

    checkConfig(config)
  })
})