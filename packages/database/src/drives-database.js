const Database = require('./database')

const FIELDS = [
  'key',
  'stats',
  'size',
  'peers',
  'info',
  'seedingStatus',
  'updatedAt',
  'createdAt'
]

class DrivesDatabase extends Database {
  async create (key) {
    const initialData = [
      ['key', key],
      ['stats', {}],
      ['size', {
        blocks: 0,
        bytes: 0,
        downloadedBlocks: 0,
        downloadedBytes: 0
      }],
      ['peers', []],
      ['info', {}],
      ['seedingStatus', 'WAITING'],
      ['updatedAt', Date.now()],
      ['createdAt', Date.now()]
    ]

    await this._db.batch(initialData.map(([field, value]) => {
      return { type: 'put', key: this._buildKey([key, field]), value }
    }))
  }

  async get (key, field) {
    const fields = field ? [field] : FIELDS
    const data = {}

    for (const field of fields) {
      data[field] = await super.get(key, field)
    }

    if (!field && !data.key) return null

    return field ? data[field] : data
  }

  async update (key, data = {}) {
    await this._db.batch([
      ...(Object.entries(data).map(([field, value]) => ({
        type: 'put', key: this._buildKey([key, field]), value
      }))),
      { type: 'put', key: this._buildKey([key, 'updatedAt']), value: Date.now() }
    ])
  }

  async remove (key) {
    super.set(key, 'deletedAt', Date.now())
  }
}

module.exports = DrivesDatabase
