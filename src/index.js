require('dotenv').config()
const IServer = require('./IServer')

const port = process.env.PORT || 9000
const pingTimeout = process.env.PING_TIMEOUT || 5 * 60 * 1000 // 5min
const server = new IServer({ port })
server.on('error', (err) => {
  console.error(err)
})
setInterval(() => {
  server.heartbeat()
}, pingTimeout)

// const wss = new WebSocketServer({ port: process.env.PORT })
// wss.on('connection', (socket) => {
//   console.log(`Current connection count:`, wss.clients.size)
//   socket.on('message', (data) => {
//     const payload = JSON.parse(data)
//     if (payload.event === 'connected') {
//       socket.room = payload.student
//       const message = JSON.stringify({
//         event: 'user joined',
//         data: payload.session
//       })
//       wss.clients.forEach((client) => {
//         if (client.room === payload.student) {
//           client.send(message)
//         }
//       })
//     }
//   })
// })
