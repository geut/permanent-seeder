const assert = require('assert')
const Database = require('./database')
const sub = require('subleveldown')
const AutoIndex = require('level-auto-index')

class MetricsDatabase extends Database {
  constructor (params) {
    super(params)
    // create local indexes
    this.metrics = sub(this._db, 'metrics', { valueEncoding: 'json' })
    this.idx = {
      key: sub(this._db, 'metrics-key'),
      timestamp: sub(this._db, 'metrics-timestamp'),
      event: sub(this._db, 'metrics-event')
    }
    this.by = {}
    this.by.timestamp = AutoIndex(this.metrics, this.idx.timestamp, (datum = {}) => {
      return datum.key + '!' + datum.timestamp
    })
    this.by.event = AutoIndex(this.metrics, this.idx.timestamp, (datum = {}) => {
      return datum.key + '!' + datum.event
    })
  }

  _buildKey (keyParts) {
    return ['metrics', ...keyParts].join('!')
  }

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
    await this.metrics.put(key, cleanedData)
    return cleanedData
  }

  /**
   *
   * @param {object} data keyRecord to add
   * @param {boolean} updateIfExists update keyRecord if exists
   *
   * @returns {boolean} true if existent and key was updated
   */
  async add (data, updateIfExists = false) {
    const existent = await this.get(data.key, data.timestamp, data.event)

    if (existent && !updateIfExists) {
      throw new Error('Key already exists')
    }

    await this.set(data.key, data.timestamp, data.event, data)

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
    const existent = await this.get(data.key, data.timestamp, data.event)

    if (!existent && !createIfNotExists) {
      throw new Error('Key not created')
    }

    await this.set(data.key, data.timestamp, data.event, data)

    return !existent
  }

  async filterByTimestamp (key, query) {
    assert(key, 'key is required')
    return new Promise((resolve, reject) => {
      const stream = this.by.timestamp.createValueStream({
        gte: key
      })
      const out = []
      stream
        .on('data', data => {
          if (!query) {
            if (data.key.toString('hex') === key) {
              out.push(data)
            }
          } else {
            if (data.key.toString('hex') === key && data.timestamp >= query) {
              out.push(data)
            }
          }
        })
        .on('end', () => resolve(out))
        .on('error', reject)
    })
  }
}

module.exports = MetricsDatabase
