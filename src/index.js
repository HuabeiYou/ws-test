require('dotenv').config()
const { start } = require('node-memwatcher')
const IServer = require('./IServer')

const port = process.env.PORT || 9000

if (process.env.NODE_ENV === 'test') {
  start().then(() => {
    const server = new IServer({ env: 'test' })
    server.on('error', (err) => {
      console.error(err)
    })
    server.listen(port)
  })
} else {
  const server = new IServer({ env: process.env.NODE_ENV })
  server.on('error', (err) => {
    console.error(err)
  })
  server.listen(port)
  if (process.env.NODE_ENV === 'production') {
    const pingTimeout = process.env.PING_TIMEOUT || 2 * 60 * 1000 // 2min
    setInterval(() => {
      server.heartbeat()
    }, pingTimeout)
  }
}
