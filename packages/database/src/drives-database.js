const assert = require('assert')

const Database = require('./database')

class DrivesDatabase extends Database {
  _cleanKeyData (data = {}) {
    assert(Buffer.isBuffer(data.key) || typeof data.key === 'string', 'key should be string or buffer')
    const key = typeof data.key === 'string' ? data.key : data.key.toString('hex')

    return {
      ...data,
      key
    }
  }

  async onPreSet (key, data) {
    const cleanedData = this._cleanKeyData(data)
    return cleanedData
  }

  /**
   *
   * @param {object} data keyRecord to add
   */
  async add (data) {
    const initialData = {
      stats: {},
      size: {
        blocks: 0,
        bytes: 0,
        downloadedBlocks: 0
      },
      peers: [],
      info: {},
      seedingStatus: 'WAITING',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      ...data
    }

    await this.set(data.key, initialData)
  }

  /**
   *
   * @param {object} data keyRecord to update
   *
   */
  async update (key, data = {}) {
    const drive = await this.get(key)

    if (!drive) {
      await this.add(key, data)
      return
    }

    await this.set(key, {
      ...drive,
      ...data,
      updatedAt: Date.now()
    })
  }

  async remove (key) {
    const drive = await this.get(key)

    if (!drive) return

    this.update(key, { deletedAt: Date.now() })
  }
}

module.exports = DrivesDatabase
