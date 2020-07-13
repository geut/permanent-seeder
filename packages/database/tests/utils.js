const { randomBytes } = require('crypto')

const randomData = () => {
  return {
    aRandomBuffer: randomBytes(32),
    aNumber: 12.454,
    aString: 'a string',
    aBoolean: true,
    anObject: {
      withString: 'a string',
      withObject: {
        other: 'object'
      }
    },
    anArray: ['of', 4, { things: true }]
  }
}

module.exports.randomData = randomData
