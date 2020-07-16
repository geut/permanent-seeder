const { resolve } = require('path')

const { ServiceBroker } = require('moleculer')

const servicesPath = resolve(__dirname, 'services')

class SDK {
  constructor (config) {
    this._config = config
  }

  async start () {
    if (this._broker) return

    this._broker = new ServiceBroker({
      transporter: 'TCP',
      metadata: {
        config: this._config
      }
    })

    this._broker.loadServices(servicesPath)

    await this._broker.start()
  }

  async connect () {
    if (this._broker) return

    this._broker = new ServiceBroker({
      transporter: 'TCP'
    })

    await this._broker.start()
  }

  repl () {
    return this._broker.repl()
  }
}

module.exports = SDK
