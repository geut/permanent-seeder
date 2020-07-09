const { ServiceBroker } = require('moleculer')
const ApiService = require('moleculer-web')

const broker = new ServiceBroker({
  transporter: 'TCP'
})

// Load API Gateway
broker.createService(ApiService)

// Start server
broker.start()
