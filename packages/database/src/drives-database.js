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

  async getByVersion (key, version, field) {
    const fields = field ? [field] : FIELDS
    const data = {}

    for (const field of fields) {
      data[field] = await super.get(key, 'version', version, field)
    }

    if (!field && !data.key) return null

    return field ? data[field] : data
  }

  async getVersions (key) {
    const stream = super.createKeyStream([key, 'version'])

    return new Promise(resolve => {
      const versions = new Set()

      stream
        .on('data', (key) => {
          var version = key.split('!')[2]
          if (version) versions.add(version)
        })
        .on('end', () => resolve(Array.from(versions)))
    })
  }

  async getKeys () {
    const stream = super.createKeyStream()

    return new Promise(resolve => {
      const out = []
      stream
        .on('data', (key) => {
          out.push(key)
        })
        .on('end', () => resolve(out))
    })
  }

  async update (key, data = {}, version) {
    const batch = [
      ...(Object.entries(data).map(([field, value]) => ({
        type: 'put', key: this._buildKey([key, field]), value
      }))),
      { type: 'put', key: this._buildKey([key, 'updatedAt']), value: Date.now() }
    ]

    if (version) {
      batch.push(
        ...(Object.entries(data).map(([field, value]) => ({
          type: 'put', key: this._buildKey([key, 'version', version, field]), value
        })))
      )
    }

    await this._db.batch(batch)
  }

  async remove (key) {
    return this.update(key, { deletedAt: Date.now() })
  }
}

module.exports = DrivesDatabase
