const got = require('got')

const DEFAULT_ENDPOINT = 'http://localhost:3000'

class KeysUpdater {
  constructor (endpoint = DEFAULT_ENDPOINT, db) {
    this._endpoint = endpoint
    this._db = db
  }

  async fetchKeys () {
    try {
      return got(this._endpoint).json()
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async update () {
    const keys = await this.fetchKeys()

    for (const keyRecord of keys) {
      await this._db.addKey(keyRecord)
    }

    return keys
  }
}

module.exports = KeysUpdater
