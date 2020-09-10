const { resolve } = require('path')

const { ServiceBroker } = require('moleculer')

const servicesPath = resolve(__dirname, 'services')

class SDK {
  constructor (config) {
    this._config = config
  }

  _createBroker (name, options = {}) {
    this._broker = new ServiceBroker({
      nodeID: name ? `${name}-${Date.now()}` : undefined,
      transporter: {
        type: 'TCP',
        options: {
          udpDiscovery: false
        }
      },
      ...options
    })
  }

  async start (name = 'seeder', hotReload = false) {
    if (this._broker) return

    this._createBroker(name, {
      metadata: {
        config: this._config
      },
      hotReload
    })

    this._broker.logger.info('\nConfig: ', JSON.stringify(this._config, null, 2), '\n')

    this._broker.loadServices(servicesPath)

    await this._broker.start()
  }

  async connect (name) {
    if (this._broker) return

    this._createBroker(name)

    await this._broker.start()
  }

  repl () {
    return this._broker.repl()
  }

  async addKey (keyRecord) {
    return this._broker.call('keys.add', keyRecord)
  }

  async unseed (keyRecord) {
    return this._broker.call('seeder.unseed', keyRecord)
  }
}

module.exports = SDK
