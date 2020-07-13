const http = require('http')
const { randomBytes } = require('crypto')

const hostname = '127.0.0.1'
const port = 3000

const createRandomKeyData = () => {
  const key = randomBytes(32).toString('hex')

  return {
    key,
    title: `key-title-${key}`,
    createdAt: new Date().toString()
  }
}

const server = http.createServer((req, res) => {
  const keysCount = Math.floor(Math.random() * 10)

  const keys = Array.from({ length: keysCount }).map(createRandomKeyData)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(keys, null, 2))
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
