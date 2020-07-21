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

  async start () {
    if (this._broker) return

    this._createBroker('seeder', {
      metadata: {
        config: this._config
      }
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
}

module.exports = SDK
