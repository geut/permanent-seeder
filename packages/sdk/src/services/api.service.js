const ApiGatewayService = require('moleculer-web')
const IO = require('socket.io')

module.exports = {

  mixins: [ApiGatewayService],

  settings: {
    port: 3001,
    routes: [{
      path: '/api'
    }]
  },

  events: {
    '**' (payload, sender, event) {
      if (this.io) {
        this.io.emit('event', {
          sender,
          event,
          payload
        })
      }
    }
  },

  started () {
    setInterval(() => this.broker.emit('api.test', Date.now()), 2000)

    // Create a Socket.IO instance, passing it our server
    this.io = IO.listen(this.server)

    // Add a connect listener
    this.io.on('connection', client => {
      this.logger.info('Client connected via websocket!')

      // client.on('call', ({ action, params, opts }, done) => {
      //   this.logger.info('Received request from client! Action:', action, ', Params:', params)

      //   this.broker.call(action, params, opts)
      //     .then(res => {
      //       if (done) { done(res) }
      //     })
      //     .catch(err => this.logger.error(err))
      // })

      client.on('disconnect', () => {
        this.logger.info('Client disconnected')
      })
    })
  }
}
