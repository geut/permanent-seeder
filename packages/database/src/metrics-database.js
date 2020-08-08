const assert = require('assert')
const Database = require('./database')

class MetricsDatabase extends Database {
  _buildKey (keyParts) {
    return ['metrics', ...keyParts].join('!')
  }

  _cleanKeyData (data = {}) {
    assert(Buffer.isBuffer(data.key) || typeof data.key === 'string', 'key should be string or buffer')
    const key = typeof data.key === 'string' ? data.key : data.key.toString('hex')

    return {
      key,
      ...data
    }
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
    const existent = await this.get(data.key, data.timestamp)

    if (existent && !updateIfExists) {
      throw new Error('Key already exists')
    }

    await this.set(data.key, data.timestamp, data)

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
    const existent = await this.get(data.key, data.timestamp)

    if (!existent && !createIfNotExists) {
      throw new Error('Key not created')
    }

    await this.set(data.key, data.timestamp, data)

    return !existent
  }
}

module.exports = MetricsDatabase
