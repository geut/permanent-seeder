const assert = require('assert')
const levelup = require('levelup')
const encode = require('encoding-down')
const memdown = require('memdown')
const level = require('level-party')
const { v4: uuid } = require('uuid')

const noop = () => {}

class Database {
  constructor (db, logger) {
    const options = { valueEncoding: 'json' }

    this.logger = logger || noop

    if (typeof db === 'string') {
      this._db = level(db, options)
    } else {
      this._db = levelup(encode(memdown(), options))
    }
  }

  static createId () {
    return uuid()
  }

  _buildKey (keyParts) {
    return keyParts.join('!')
  }

  async _filter (options = {}) {
    const stream = this._db.createReadStream(options)

    return new Promise(resolve => {
      const values = []
      stream
        .on('data', data => {
          values.push(this.onAfterGet(data.key, data.value))
        })
        .on('end', () => resolve(values))
    })
  }

  async close () {
    await this._db.close()
  }

  async set (...args) {
    assert(args.length > 1, 'Missing value and/or key parts. Use db.set(...keyParts, value)')

    const [data] = args.slice(-1)
    const [...keyParts] = args.slice(0, -1)
    const key = this._buildKey(keyParts)

    const newData = await this.onPreSet(key, data)
    await this._db.put(key, newData)
  }

  async get (...keyParts) {
    try {
      const key = this._buildKey(keyParts)
      const data = await this._db.get(key)

      return this.onAfterGet(key, data)
    } catch (error) {
      if (error.type === 'NotFoundError') {
        return null
      }

      throw error
    }
  }

  async getAll (...keyParts) {
    const gte = this._buildKey([...keyParts, ''])

    const filter = {
      gte,
      lte: `${gte}~`
    }

    return this._filter(filter)
  }

  async batch (keys = []) {
    const buildKeys = keys.map(datum => ({ type: 'del', key: this._buildKey([datum.key]) }))
    return this._db.batch(buildKeys)
  }

  async remove (...keyParts) {
    return this._db.del(this._buildKey(keyParts))
  }

  createReadStream (args = []) {
    let keyParts
    let options = {}

    if (args.length > 0 && Array.isArray(args[0])) {
      keyParts = args[0]

      const gte = this._buildKey([...keyParts, ''])

      options = {
        gte,
        lte: `${gte}~`,
        ...(args.length > 1 ? args[args.length - 1] : undefined)
      }
    }

    return this._db.createReadStream(options)
  }

  createKeyStream (filter) {
    let options = {}

    if (filter && Array.isArray(filter)) {
      const gte = this._buildKey(filter)

      options = {
        gte,
        lte: `${gte}~`
      }
    }

    return this._db.createKeyStream(options)
  }

  onPreSet (key, value) {
    return value
  }

  onAfterGet (key, value) {
    return value
  }
}

module.exports = Database
