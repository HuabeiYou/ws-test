require('dotenv').config()
const { Server } = require('socket.io')

const io = new Server(process.env.PORT, {
  cors: {
    origin: 'http://localhost:5000',
    credentials: true
  },
})
io.on('connection', (socket) => {
  socket.on('connected', ({ session, student }) => {
    socket.join(student)
    io.to(student).emit('user joined', session)
  })
})
