
const memdown = require('memdown')

const { randomData } = require('./utils')

const Database = require('../src/database')

let db

beforeEach(() => {
  db = new Database(memdown())
})

test('set / get', async () => {
  const buildKeyMethod = jest.spyOn(db, '_buildKey')
  const objectData = {
    a: 'property',
    another: { inner: 'object' }
  }

  expect(db.set()).rejects.toBeTruthy()
  expect(db.set('a')).rejects.toBeTruthy()

  await db.set('a', '1', 'a string')
  await db.set('a', '2', '2nd string')
  await db.set('b', [2, 3])
  await db.set('c', 3)
  await db.set('c', 4)
  await db.set('an object', objectData)

  expect(buildKeyMethod).toHaveBeenCalledTimes(6)

  expect(db.get('a', '1')).resolves.toBe('a string')
  expect(db.get('a', '2')).resolves.toBe('2nd string')
  expect(db.get('b')).resolves.toStrictEqual([2, 3])
  expect(db.get('c')).resolves.toStrictEqual(4)
  expect(db.get('an object')).resolves.toEqual(objectData)

  expect(buildKeyMethod).toHaveBeenCalledTimes(11)

  const notPresentKey = await db.get('not-present')
  expect(notPresentKey).toBeNull()
})

test('get all', async () => {
  // eslint-disable-next-line no-unused-vars
  for (const _ of Array.from({ length: 10 })) {
    const data = randomData()
    await db.set('a', 'collection', data.aRandomBuffer.toString('hex'), data)
  }

  // Not included on before collection
  const data = randomData()
  await db.set('a', 'collection2', data.aRandomBuffer.toString('hex'), data)

  expect(db.getAll('a', 'collection')).resolves.toHaveLength(10)
  expect(db.getAll('a', 'collection2')).resolves.toHaveLength(1)
})

test('remove', async () => {
  await db.set('will', 'be', 'removed', 'value to be removed')

  await db.remove('will', 'be', 'removed')

  expect(db.get('will', 'be', 'removed')).resolves.toBeNull()
})
