const { resolve, join } = require('path')
const assert = require('assert')

const level = require('level')
const levelup = require('levelup')
const encode = require('encoding-down')

const { v4: uuid } = require('uuid')

const DEFAULT_DB_PATH = resolve(join(process.cwd(), 'keys.db'))

class KeysDB {
  constructor (db = DEFAULT_DB_PATH) {
    if (typeof db !== 'string') {
      this._db = levelup(encode(db, { valueEncoding: 'json' }))
      return
    }

    this._db = level(db, { valueEncoding: 'json' })
  }

  _keyId (id = '') {
    return `key:${id}`
  }

  _cleanKeyData (data = {}) {
    assert(typeof data.title === 'string', 'title must be a string')
    assert(data.title.length > 0, 'title must be a valid string')
    assert(typeof data.key === 'string', 'key must be a valid string')
    assert(data.key.length === 64, 'key must be a valid 32-byte key string')
    assert(typeof data.createdAt === 'string', 'createdAt must be a date string')
    assert(data.createdAt.length > 0, 'createdAt must be a valid date string')

    return {
      title: data.title,
      key: data.key,
      createdAt: data.createdAt
    }
  }

  async getKey (id) {
    try {
      const key = await this._db.get(this._keyId(id))
      return key
    } catch (error) {
      if (error.type === 'NotFoundError') {
        return null
      }
      throw error
    }
  }

  async getKeys () {
    const stream = this._db.createValueStream({ gt: this._keyId() })

    return new Promise(resolve => {
      const keys = []
      stream
        .on('data', key => keys.push(key))
        .on('end', () => resolve(keys))
    })
  }

  async addKey (data) {
    const id = uuid()
    const keyData = this._cleanKeyData(data)

    await this._db.put(this._keyId(id), keyData)

    return id
  }

  async updateKey (id, data) {
    const keyData = this._cleanKeyData(data)
    return this._db.put(this._keyId(id), keyData)
  }

  async removeKey (id) {
    return this._db.del(this._keyId(id))
  }
}

module.exports = KeysDB
