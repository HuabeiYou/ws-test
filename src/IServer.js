const EventEmitter = require('events')
const { WebSocketServer } = require('ws')
const { v4 } = require('uuid')
const debug = require('debug')
const wssDebug = debug('wss')
const clientDebug = debug('client')

const EVENT_PAYLOAD = {
  pong: JSON.stringify({ event: 'pong' }),
}

module.exports = class IServer extends EventEmitter {
  constructor(props) {
    super(props)
    this.rooms = new Map()
    this.clients = new Map()
    this.connections = new Set()
    this.wss = new WebSocketServer(props)
    this.wss.on('connection', (socket, req) =>
      this._onSocketConnection(socket, req)
    )
    this.wss.on('error', (error) => {
      wssDebug(`Server Error: ${error}`)
      this.emit('error', error)
    })
  }

  _onSocketConnection(socket, req) {
    socket.id = v4()
    this.clients.set(socket.id, socket)
    wssDebug(`Client +1. Current total: ${this.wss.clients.size}`)
    this._configureSocket(socket)
    socket.send(JSON.stringify({ event: 'open', id: socket.id }))
  }

  _onSocketClose(socket) {
    if (this.rooms.has(socket.room)) {
      this.rooms.get(socket.room).delete(socket.id)
      if (this.rooms.get(socket.room).size === 0) {
        this.rooms.delete(socket.room)
      }
    }
    this.clients.delete(socket.id)
    wssDebug(`Client -1. Current total: ${this.wss.clients.size}`)
  }

  _configureSocket(socket) {
    socket.on('close', () => this._onSocketClose(socket))
    socket.on('ping', () => {
      this.connections.add(socket.id)
      socket.emit('pong')
    })
    socket.on('message', (data) => {
      clientDebug('Received message %s from %s', data, socket.id)
      const message = JSON.parse(data)
      if (message.event === 'connected') {
        const room = message.student
        if (!this.rooms.has(room)) {
          this.rooms.set(room, new Set([socket.id]))
        } else {
          if (!this.rooms.get(room).has(socket.id)) {
            this.rooms.get(room).add(socket.id)
          }
          const payload = JSON.stringify({
            event: 'user joined',
            data: message.session,
          })
          this.boardcast(room, payload)
        }
      }
    })
  }

  boardcast(room, message) {
    wssDebug('Boardcasting %s in Room %s', message, room)
    for (let sid of this.rooms.get(room)) {
      if (this.clients.has(sid)) {
        this.clients.get(sid).send(message)
      }
    }
  }

  heartbeat() {
    this.wss.clients.forEach((client) => {
      if (
        client.readyState === client.OPEN ||
        client.readyState === client.CONNECTING
      ) {
        if (!this.connections.has(client.id)) {
          client.close()
        }
      }
    })
    this.connections.clear()
  }
}
