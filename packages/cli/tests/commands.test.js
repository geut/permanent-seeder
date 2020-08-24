const { encode } = require('dat-encoding')

jest.mock('../src/config', () => {
  const moduleMock = jest.requireActual('../src/config')
  const { join, resolve } = require('path')
  const { readFileSync } = require('fs')
  const lodashGet = require('lodash.get')
  const tomlParse = require('@iarna/toml/parse')
  const tempy = require('tempy')

  const tmpDir = tempy.directory()

  return {
    ...moduleMock,
    get: (key, options = {}) => {
      const CONFIG_FILENAME = 'permanent-seeder.toml'
      const getConfigFileContent = (folderPath) => {
        const filePath = resolve(join(folderPath, CONFIG_FILENAME))
        let content
        try {
          content = readFileSync(filePath, { encoding: 'utf-8' })
        } catch (error) {}

        return content
      }

      const getConfig = (folderPath, fallbackValue) => {
        const content = getConfigFileContent(folderPath)

        return content ? tomlParse(content) : (fallbackValue !== undefined ? fallbackValue : {})
      }

      const localConfig = getConfig(tmpDir)

      if (key) {
        return lodashGet(localConfig, key)
      }

      return localConfig
    },
    tmpDir
  }
})

const config = require('../src/config')
const ConfigInitCommand = require('../src/commands/config/init')
const StartCommand = require('../src/commands/start')
const AddCommand = require('../src/commands/key/add')
const GetCommand = require('../src/commands/key/get')
const RemoveCommand = require('../src/commands/key/remove')
const StopCommand = require('../src/commands/stop')

describe('Test Commands', () => {
  let result
  beforeAll(async () => {
    // NOTE(dk): we need a way to pass a custom directory for testing
    // We can pass a custom dir to config.init
    // but the config.get command is merging two totally different configs
    await StopCommand.run([])
    await ConfigInitCommand.run([`-t=${config.tmpDir}`])
    await StartCommand.run(['--restart'])
  })

  afterAll(async () => {
    await StopCommand.run([])
  })

  beforeEach(() => {
    result = []
    jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(val =>
        result.push(val)
      )
  })

  afterEach(() => jest.restoreAllMocks())

  it('Add: should work with key and title', async () => {
    const key = '6161616161616161616161616161616161616161616161616161616161616161'
    const title = 'test'
    await AddCommand.run([`-k=${key}`, `-t=${title}`])
    expect(result[0]).toContain('Key added!')
  })

  it('Add: should work with prefixed key and title', async () => {
    const key = 'hyper://875e345e0330dec963f825004d72fca7b21f92c4b5d2e96ec92ee0708204d918'
    const title = 'test 2'
    await AddCommand.run([`-k=${key}`, `-t=${title}`])
    expect(result[0]).toContain('Key added!')
  })

  it('get: key', async () => {
    const key = '875e345e0330dec963f825004d72fca7b21f92c4b5d2e96ec92ee0708204d918'
    await GetCommand.run([`--dbPath=${config.tmpDir}/keys.db`, key])
    const expected = {
      title: 'test 2',
      key
    }
    expect(result[0]).toContain(JSON.stringify(expected, null, 2))
  })

  it('get: use prefix', async () => {
    const key = 'hyper://6161616161616161616161616161616161616161616161616161616161616161'
    await GetCommand.run([key])
    const expected = {
      title: 'test',
      key: encode(key)
    }
    expect(result[0]).toContain(JSON.stringify(expected, null, 2))
  })

  it('get: all', async () => {
    await GetCommand.run([])
    const expected = [{
      title: 'test',
      key: '6161616161616161616161616161616161616161616161616161616161616161'
    },
    {
      key: '875e345e0330dec963f825004d72fca7b21f92c4b5d2e96ec92ee0708204d918',
      title: 'test 2'
    }
    ]
    expect(result[0]).toContain(JSON.stringify(expected, null, 2))
  })

  it('remove: key', async () => {
    const key = '6161616161616161616161616161616161616161616161616161616161616161'
    await RemoveCommand.run([key])

    expect(result[0]).toContain('Key removed')
  })

  it('remove: prefixed key', async () => {
    const key = 'hyper://875e345e0330dec963f825004d72fca7b21f92c4b5d2e96ec92ee0708204d918'
    await RemoveCommand.run([key])
    expect(result[0]).toContain('Key removed')
  })
})
