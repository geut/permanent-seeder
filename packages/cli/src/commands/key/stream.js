const BaseCommand = require('../../base-command')

const KeyCommand = require('.')

class StreamCommand extends KeyCommand {
  async run () {
    const { argv: keyParts } = this.parse(StreamCommand)

    const stream = this._keysDatabase.createReadStream(keyParts.length > 0 ? keyParts : undefined)

    stream.on('data', console.log)
  }
}

StreamCommand.description = 'Live stream keys to console'

StreamCommand.args = [
  { name: 'key part 1', description: 'First key part to show\nIf not present shows all config entries' },
  { name: 'key part 2', required: false }
]

StreamCommand.strict = false

StreamCommand.flags = {
  ...KeyCommand.flags,
  ...BaseCommand.flags
}

module.exports = StreamCommand
