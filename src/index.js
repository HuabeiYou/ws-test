require('dotenv').config()
const { start } = require('node-memwatcher')
const IServer = require('./IServer')

const port = process.env.PORT || 9000

if (process.env.NODE_ENV === 'test') {
  start().then(() => {
    const server = new IServer({ port })
    server.on('error', (err) => {
      console.error(err)
    })
  })
} else {
  const server = new IServer({ port })
  server.on('error', (err) => {
    console.error(err)
  })
  if (process.env.NODE_ENV === 'production') {
    const pingTimeout = process.env.PING_TIMEOUT || 2 * 60 * 1000 // 2min
    setInterval(() => {
      server.heartbeat()
    }, pingTimeout)
  }
}
