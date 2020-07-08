
const { randomBytes } = require('crypto')
const memdown = require('memdown')
const levelup = require('levelup')

const KeysDB = require('../src/keys-db')

let keysDB

const createRandomKeyData = () => {
  const key = randomBytes(32).toString('hex')

  return {
    key,
    title: `key-title-${key}`,
    createdAt: new Date().toString()
  }
}

beforeEach(() => {
  keysDB = new KeysDB(memdown())
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
  const spy = jest.spyOn(keysDB, '_cleanKeyData')

  const data = createRandomKeyData()

  const id = await keysDB.addKey(data)
  expect(keysDB.addKey(null)).rejects.toBeTruthy()

  expect(spy).toHaveBeenCalledTimes(2)

  const createdKey = await keysDB.getKey(id)
  expect(createdKey).toMatchObject(data)

  const notPresentKey = await keysDB.getKey('not-present')
  expect(notPresentKey).toBeNull()
})

test('get all keys', async () => {
  // eslint-disable-next-line no-unused-vars
  for (const _ of Array.from({ length: 10 })) {
    const data = createRandomKeyData()
    await keysDB.addKey(data)
  }

  const keys = await keysDB.getKeys()

  expect(keys.length).toBe(10)
})

test('update key', async () => {
  const spy = jest.spyOn(keysDB, '_cleanKeyData')

  const data = createRandomKeyData()

  const id = await keysDB.addKey(data)
  const createdKey = await keysDB.getKey(id)

  createdKey.title = 'updated-key'
  createdKey.key = randomBytes(32).toString('hex')

  await keysDB.updateKey(id, createdKey)
  const updatedKey = await keysDB.getKey(id)

  expect(createdKey).toMatchObject(updatedKey)
  expect(spy).toHaveBeenCalledTimes(2)
})

test('remove key', async () => {
  const data = createRandomKeyData()

  const id = await keysDB.addKey(data)

  await keysDB.removeKey(id)
  await keysDB.removeKey('not-present')

  const removedKey = await keysDB.getKey(id)

  expect(removedKey).toBe(null)
})
