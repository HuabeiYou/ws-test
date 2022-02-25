const EventEmitter = require('events')
const { WebSocketServer } = require('ws')

export class IServer extends EventEmitter {
  constructor(props) {
    super(props);
    this.rooms = new Map()
    this.socketServer = new WebSocketServer(props);
    this.socketServer.on("connection", (socket, req) => this._onSocketConnection(socket, req));
    this.socketServer.on("error", (error) => this._onSocketError(error));
  }

  _onSocketConnection(socket, req) {
    console.dir(req)
    socket.send(JSON.stringify({ event: 'open' }));
    this._configureWS(socket);
  }

  _onSocketError(error) {
    this.emit("error", error);
  }

  configureWS(socket, client) {
    socket.on("close", () => {
      // remove from rooms
      const room = this.rooms.get(socket.room)
      if (room) {
        if (room.length === 1 && room[0] === socket.id) {
          this.rooms.delete(socket.room)
        } else {
          this.rooms.set(socket.room, room.filter(p => p !== socket.id))
        }
      }
    })

    socket.on("message", (data) => {
      const message = JSON.parse(data)
      if (message.event === 'connected') {
        socket.room = payload.student
        const payload = JSON.stringify({
          event: 'user joined',
          data: payload.session
        })
        wss.clients.forEach((client) => {
          if (client.room === message.student) {
            client.send(payload)
          }
        })
      }
    });
  }
}

