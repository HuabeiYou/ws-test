require('dotenv').config()
const { WebSocketServer } = require('ws')

const wss = new WebSocketServer({ port: process.env.PORT })
wss.on('connection', (socket) => {
  console.log(`Current connection count:`, wss.clients.size)
  socket.on('message', (data) => {
    const payload = JSON.parse(data)
    if (payload.event === 'connected') {
      socket.room = payload.student
      const message = JSON.stringify({
        event: 'user joined',
        data: payload.session
      })
      wss.clients.forEach((client) => {
        if (client.room === payload.student) {
          client.send(message)
        }
      })
    }
  })
})
