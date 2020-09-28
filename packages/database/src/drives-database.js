const assert = require('assert')
const Database = require('./database')
const sub = require('subleveldown')

class DrivesDatabase extends Database {
  constructor (params) {
    super(params)
    // create local indexes
    this.drives = sub(this._db, 'drives', { valueEncoding: 'json' })
  }

  _buildKey (keyParts) {
    return ['drives', ...keyParts].join('!')
  }

  _cleanKeyData (data = {}) {
    console.log({ data })
    assert(Buffer.isBuffer(data.key) || typeof data.key === 'string', 'key should be string or buffer')
    const key = typeof data.key === 'string' ? data.key : data.key.toString('hex')

    return {
      ...data,
      key
    }
  }

  async onPreSet (key, data) {
    const cleanedData = this._cleanKeyData(data)
    await this.drives.put(key, cleanedData)
    return cleanedData
  }

  /**
   *
   * @param {object} data keyRecord to add
   *
   * @returns {boolean} true if existent and key was updated
   */
  async add (data) {
    await this.set(data.key, data)
  }

  /**
   *
   * @param {object} data keyRecord to update
   *
   */
  async update (key, prop, data) {
    let val = await this.get(key)
    if (!val) {
      val = { key }
    }
    val[prop] = data

    await this.set(key, val)
  }
}

module.exports = DrivesDatabase
