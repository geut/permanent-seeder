const assert = require('assert')

const Database = require('./database')

class KeysDatabase extends Database {
  _cleanKeyData (data = {}) {
    assert(typeof data.title === 'string', 'title must be a string')
    assert(data.title.length > 0, 'title must be a valid string')
    assert(typeof data.key === 'string', 'key must be a valid string')
    assert(data.key.length === 64, 'key must be a valid 32-byte key string')

    return {
      title: data.title,
      key: data.key
    }
  }

  _buildKey (keyParts) {
    return ['keys', ...keyParts].join('!')
  }

  onPreSet (key, data) {
    return this._cleanKeyData(data)
  }

  async add (data, updateIfExists = false) {
    const existent = await this.get(data.key)

    if (existent && !updateIfExists) {
      throw new Error('Key already exists')
    }

    return this.set(data.key, data)
  }

  async update (data, createIfNotExists = false) {
    const existent = await this.get(data.key)

    if (!existent && !createIfNotExists) {
      throw new Error('Key not created')
    }

    return this.set(data.key, data)
  }
}

module.exports = KeysDatabase
