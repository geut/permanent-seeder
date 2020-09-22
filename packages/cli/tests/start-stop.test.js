jest.mock('../src/constants', () => ({
  ...jest.requireActual('../src/constants'),
  SEEDER_DAEMON: 'seeder-daemon-test'
}))

const ConfigInitCommand = require('../src/commands/config/init')
const StartCommand = require('../src/commands/start')
const StopCommand = require('../src/commands/stop')
const { pm2Delete } = require('../src/pm2-async')

jest.setTimeout(10000)

beforeEach(async () => {
  try {
    await StopCommand.run([])
    await pm2Delete('seeder-daemon-test')
  } catch (_) {}
})

afterEach(async () => {
  try {
    await StopCommand.run([])
    await pm2Delete('seeder-daemon-test')
  } catch (_) {}
})

describe('Start Command', () => {
  it('Should not start without config', async () => {
    await expect(StartCommand.run([])).rejects.toThrow()
  })

  it('Should start with config', async () => {
    // Config will keep as default from here
    await ConfigInitCommand.run([])
    await expect(StartCommand.run([])).resolves.not.toThrow()
  })

  it('Should not start if running', async () => {
    await StartCommand.run([])
    await expect(StartCommand.run([])).rejects.toThrow()
  })

  it('Should start if running and --restart', async () => {
    await StartCommand.run([])
    await expect(StartCommand.run(['--restart'])).resolves.not.toThrow()
  })

  it('Should start if not running and --restart', async () => {
    await expect(StartCommand.run(['--restart'])).resolves.not.toThrow()
  })

  it('Should stop if running', async () => {
    await StartCommand.run([])
    await expect(StopCommand.run([])).resolves.not.toThrow()
  })

  it('Should not reject stop command, if not running', async () => {
    await expect(StopCommand.run([])).resolves.not.toThrow()
  })
})
