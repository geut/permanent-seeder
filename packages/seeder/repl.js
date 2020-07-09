const { ServiceBroker } = require('moleculer')

// Create a ServiceBroker
const broker = new ServiceBroker({
  transporter: 'TCP'
})

;(async () => {
  // Start the broker
  await broker.start()
  broker.repl()
})()
