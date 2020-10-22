const { EventEmitter } = require('events')
const { resolve, join } = require('path')

const { ServiceBroker } = require('moleculer')

const servicesPath = resolve(__dirname, 'services')

class SDK extends EventEmitter {
  constructor (config) {
    super()
    this._config = config
  }

  _createBroker (options = {}) {
    this._broker = new ServiceBroker({
      cacher: {
        type: 'Memory',
        options: {
          maxParamsLength: 60
        }
      },
      nodeID: 'seeder',
      transporter: {
        type: 'TCP',
        options: {
          udpDiscovery: false
        }
      },
      logger: [
        {
          type: 'Pino',
          options: {
            level: 'info',
            pino: {
              options: {
                crlf: true,
                base: null // Hide pid, hostname
              },
              destination: join(this._config.path, 'logs', 'output.log')
            }
          }
        },
        {
          type: 'Pino',
          options: {
            level: 'warn',
            pino: {
              options: {
                crlf: true,
                base: null // Hide pid, hostname
              },
              destination: join(this._config.path, 'logs', 'error.log')
            }
          }
        }
      ],
      ...options
    })
  }

  async start () {
    if (this._broker) return

    const self = this

    this._createBroker({
      metadata: {
        config: this._config
      },

      started (broker) {
        self.emit('ready')
      },

      stopped (broker) {
        self.emit('stopped')
      }
    })

    this._broker.logger.info(this._config, 'SDK config')

    this._broker.loadServices(servicesPath)

    await this._broker.start()
  }

  async stop () {
    await this._broker.stop()
  }

  async connect () {
    if (this._broker) return

    this._createBroker()

    await this._broker.start()
  }

  repl () {
    return this._broker.repl()
  }

  async addKey (keyRecord) {
    return this._broker.call('keys.add', keyRecord)
  }

  async fetchKeys () {
    return this._broker.call('keys-updater.update')
  }

  async unseed (keyRecord) {
    return this._broker.call('seeder.unseed', keyRecord)
  }
}

module.exports = SDK
