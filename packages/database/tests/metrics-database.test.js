const { randomBytes } = require('crypto')

const memdown = require('memdown')
const levelup = require('levelup')

const MetricsDatabase = require('../src/metrics-database')

let metricsDB

const createRandomKeyData = () => {
  const key = randomBytes(32).toString('hex')

  return {
    key,
    timestamp: Date.now(),
    drive: {
      size: 1024,
      atime: '2017-04-10T18:59:00.147Z',
      mtime: '2017-04-10T18:59:00.147Z',
      ctime: '2017-04-10T18:59:00.147Z'
    },
    content: {
      key,
      discoveryKey: {},
      peerCount: 1,
      peers: [
        {
          uploadedBytes: 512,
          uploadedBlocks: 2,
          downloadedBytes: 0,
          downloadedBlocks: 0,
          remoteAddress: '::ffff:192.168.0.223'
        }
      ],
      uploadedBytes: 256,
      uploadedBlocks: 2,
      downloadedBytes: 0,
      downloadedBlocks: 10,
      totalBlocks: 10
    },
    metadata: {
      key,
      discoveryKey: {},
      peerCount: 1,
      peers: [
        {
          uploadedBytes: 101,
          uploadedBlocks: 2,
          downloadedBytes: 0,
          downloadedBlocks: 0,
          remoteAddress: '::ffff:192.168.0.223'
        }
      ],
      uploadedBytes: 101,
      uploadedBlocks: 2,
      downloadedBytes: 0,
      downloadedBlocks: 5,
      totalBlocks: 5
    },
    network: {
      announce: true,
      lookup: false
    }
  }
}

beforeEach(() => {
  metricsDB = new MetricsDatabase(memdown())
})

test('db created', () => {
  expect(metricsDB._db).toBeTruthy()
  expect(metricsDB._db).toBeInstanceOf(levelup)
})

test('clean/validate key', () => {
  // TBD
})

test('get/add key', async () => {
  const data = createRandomKeyData()

  await metricsDB.add(data)

  expect(metricsDB.add(data)).rejects.toBeTruthy()

  data.title = 'updated-key'
  await metricsDB.add(data, true)

  const dataKey = [data.key.toString('hex'), data.timestamp]
  const createdKey = await metricsDB.get(...dataKey)
  expect(createdKey).toMatchObject(data)
})

test('get all keys', async () => {
  // eslint-disable-next-line no-unused-vars
  for (const _ of Array.from({ length: 10 })) {
    const data = createRandomKeyData()
    // key = (driveKey|timestamp)
    const dataKey = [data.key, data.timestamp]
    await metricsDB.set(...dataKey, data)
  }

  const keys = await metricsDB.getAll()

  expect(keys.length).toBe(10)
})

test('update key', async () => {
  const data = createRandomKeyData()

  const dataKey = [data.key, data.timestamp]
  await metricsDB.add(data)
  const createdKey = await metricsDB.get(...dataKey)

  createdKey.drive.size = 2048

  await metricsDB.update(createdKey)
  const updatedKey = await metricsDB.get(...dataKey)

  const notExistentKey = createRandomKeyData()
  expect(metricsDB.update(notExistentKey)).rejects.toBeTruthy()

  expect(createdKey).toMatchObject(updatedKey)
})

test('remove key', async () => {
  const data = createRandomKeyData()

  await metricsDB.add(data)

  const dataKey = [data.key, data.timestamp]
  await metricsDB.remove(...dataKey)
  await metricsDB.remove('not-present')

  const removedKey = await metricsDB.get(...dataKey)

  expect(removedKey).toBe(null)
})

test('filter keys', async () => {
  // eslint-disable-next-line no-unused-vars
  for (const _ of Array.from({ length: 10 })) {
    const data = createRandomKeyData()
    const dataKey = [data.key, data.timestamp]
    await metricsDB.set(...dataKey, data)
  }

  const keys = await metricsDB.getAll()
  expect(keys.length).toBe(10)
  const firstBatchKey = keys[0].key

  // add one extra key
  const data = createRandomKeyData()
  data.key = randomBytes(32).toString('hex')
  const dataKey = [data.key, data.timestamp]
  await metricsDB.set(...dataKey, data)
  const keys2 = await metricsDB.getAll()
  expect(keys2.length).toBe(11)

  // filter by key
  // const gte = `metrics!${firstBatchKey}!`
  const gte = metricsDB._buildKey([firstBatchKey, ''])

  console.log({ gte })

  const filter = {
    lte: `${gte}~`
  }
  const keysFiltered = metricsDB._filter(filter)
  // expect(metricsDB.getAll(firstBatchKey)).resolves.toHaveLength(10)
  expect(keysFiltered.length).toBe(10)
})
