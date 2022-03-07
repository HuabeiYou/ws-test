import { config } from 'dotenv'
import { start } from 'node-memwatcher'
import { Server } from 'socket.io'

config()
function createServer() {
  const io = new Server(process.env.PORT, {
    cors: {
      origin: ['http://localhost:5000', 'http://137.184.236.245'],
      credentials: true,
    },
  })
  io.on('connection', (socket) => {
    socket.on('connected', function ({ session, student }) {
      this.join(student)
      io.to(student).emit('user joined', session)
    })
    socket.on('hello', function () {
      io.to(this.id).emit('hey')
    })
  })
  return io
}

if (process.env.NODE_ENV !== 'develop') {
  start().then(createServer)
} else {
  createServer()
}
