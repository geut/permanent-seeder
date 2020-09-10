const assert = require('assert')

const Database = require('./database')

class KeysDatabase extends Database {
  _cleanKeyData (data = {}) {
    assert(typeof data.key === 'string', 'key must be a valid string')
    assert(data.key.length === 64, 'key must be a valid 32-byte key string')

    return {
      key: data.key
    }
  }

  _buildKey (keyParts) {
    return ['keys', ...keyParts].join('!')
  }

  onPreSet (key, data) {
    return this._cleanKeyData(data)
  }

  /**
   *
   * @param {object} data keyRecord to add
   * @param {boolean} updateIfExists update keyRecord if exists
   *
   * @returns {boolean} true if existent and key was updated
   */
  async add (data, updateIfExists = false) {
    const existent = await this.get(data.key)

    if (existent && !updateIfExists) {
      throw new Error('Key already exists')
    }

    await this.set(data.key, data)

    return !!existent
  }

  /**
   *
   * @param {object} data keyRecord to update
   * @param {boolean} createIfNotExists create keyRecord if not exists
   *
   * @returns {boolean} true if not existent and key was created
   */
  async update (data, createIfNotExists = false) {
    const existent = await this.get(data.key)

    if (!existent && !createIfNotExists) {
      throw new Error('Key not created')
    }

    await this.set(data.key, data)

    return !existent
  }
}

module.exports = KeysDatabase
