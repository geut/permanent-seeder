const Config = {
  settings: {
    config: { empty: true }
  },

  created () {
    this.settings.config = this.broker.metadata.config
  }
}

module.exports.Config = Config
