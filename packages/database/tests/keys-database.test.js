
const { randomBytes } = require('crypto')

const memdown = require('memdown')
const levelup = require('levelup')

const KeysDatabase = require('../src/keys-database')

let keysDB

const createRandomKeyData = () => {
  const key = randomBytes(32).toString('hex')

  return {
    key,
    title: `key-title-${key}`
  }
}

beforeEach(() => {
  keysDB = new KeysDatabase(memdown())
})

test('db created', () => {
  expect(keysDB._db).toBeTruthy()
  expect(keysDB._db).toBeInstanceOf(levelup)
})

test('clean/validate key', () => {
  expect(() => keysDB._cleanKeyData()).toThrow()
  expect(() => keysDB._cleanKeyData({})).toThrow()
  expect(() => keysDB._cleanKeyData({ a: 'not a valid key ' })).toThrow()
  expect(() => keysDB._cleanKeyData(1)).toThrow()
  expect(() => keysDB._cleanKeyData('key')).toThrow()
  expect(() => keysDB._cleanKeyData({ key: 'missing other keys' })).toThrow()
})

test('get/add key', async () => {
  const cleanDataMethod = jest.spyOn(keysDB, '_cleanKeyData')

  const data = createRandomKeyData()

  await keysDB.add(data)

  expect(keysDB.add(data)).rejects.toBeTruthy()

  data.title = 'updated-key'
  await keysDB.add(data, true)

  expect(cleanDataMethod).toHaveBeenCalledTimes(2)

  const createdKey = await keysDB.get(data.key)
  expect(createdKey).toMatchObject(data)
})

test('get all keys', async () => {
  // eslint-disable-next-line no-unused-vars
  for (const _ of Array.from({ length: 10 })) {
    const data = createRandomKeyData()
    await keysDB.set(data.key, data)
  }

  const keys = await keysDB.getAll()

  expect(keys.length).toBe(10)
})

test('update key', async () => {
  const cleanDataMethod = jest.spyOn(keysDB, '_cleanKeyData')

  const data = createRandomKeyData()

  await keysDB.add(data)
  const createdKey = await keysDB.get(data.key)

  createdKey.title = 'updated-key'

  await keysDB.update(createdKey)
  const updatedKey = await keysDB.get(data.key)

  const notExistentKey = createRandomKeyData()
  expect(keysDB.update(notExistentKey)).rejects.toBeTruthy()

  expect(createdKey).toMatchObject(updatedKey)
  expect(cleanDataMethod).toHaveBeenCalledTimes(2)
})

test('remove key', async () => {
  const data = createRandomKeyData()

  await keysDB.add(data)

  await keysDB.remove(data.key)
  await keysDB.remove('not-present')

  const removedKey = await keysDB.get(data.key)

  expect(removedKey).toBe(null)
})
