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
      transporter: 'TCP',
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

  addKey (keyRecord) {
    return this._broker.call('keys.add', keyRecord)
  }
}

module.exports = SDK
