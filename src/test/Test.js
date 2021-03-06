const EventEmitter = require('events')
const { writeFileSync } = require('fs')
const WebSocket = require('ws')
// const SERVER_URL = 'ws://137.184.236.245:9000'
const SERVER_URL = 'ws://localhost:9000'
const MESSAGE_INTERVAL = 50

const mapToCSV = (mapObj) => {
  const csvArr = []
  mapObj.forEach((value, key) => {
    csvArr.push(`${key},${value}`)
  })
  return csvArr.join('\n')
}

class WaitingRoom extends EventEmitter {
  constructor(props) {
    super(props)
    this.space = new Set()
  }

  has(id) {
    return this.space.has(id)
  }

  add(id) {
    return this.space.add(id)
  }

  delete(id) {
    return this.space.delete(id)
  }

  remove(id) {
    this.delete(id)
    if (this.space.size === 0) {
      this.emit('room cleared')
    }
  }
}

class Test extends EventEmitter {
  constructor(props) {
    super(props)
    this.targetClientSize = props.targetClientSize
    this.targetSampleSize = props.targetSampleSize
    this.clients = new Set()
    this.connectTime = new Map()
    this.roundTripTime = []
    this.connectingRoom = new WaitingRoom()
    this.messagingRoom = new WaitingRoom()
    this.connectingRoom.on('room cleared', async () => {
      console.log('All clients connected, current count:', this.clients.size)
      this.clients.forEach(async (ws) => {
        if (ws.readyState === ws.OPEN) {
          this.messagingRoom.add(ws.id)
          ws.lastMessageSentAt = Date.now()
          ws.ping()
          await new Promise((resolve) => {
            setTimeout(resolve, MESSAGE_INTERVAL)
          })
        }
      })
    })
    this.messagingRoom.on('room cleared', async () => {
      writeFileSync(
        `RoundTripTime_${this.targetClientSize}.txt`,
        this.roundTripTime.join('\n')
      )
      console.log('All messages have been received.')
      writeFileSync(
        `ConnectTime_${this.targetClientSize}.txt`,
        mapToCSV(this.connectTime)
      )
      this.clients.forEach((ws) => {
        ws.close()
      })
      this.emit('finished')
    })
  }

  start() {
    console.log('New test started...')
    while (this.clients.size < this.targetClientSize) {
      const index = this.clients.size + 1
      this.connectingRoom.add(index)
      const ws = new WebSocket(SERVER_URL, {
        perMessageDeflate: false,
      })
      ws.index = index
      ws.createdAt = Date.now()
      ws.addEventListener('error', (e) => {
        console.log(e.message)
        this.connectingRoom.delete(ws.index)
        this.messagingRoom.delete(ws.id)
        ws.close()
      })
      ws.on('message', (data) => {
        const message = JSON.parse(data)
        if (message.event === 'open') {
          ws.id = message.id
          const timeLapse = Date.now() - ws.createdAt
          ws.emit('server connected', { timeLapse })
        }
      })
      ws.on('pong', () => {
        const timeLapse = Date.now() - ws.lastMessageSentAt
        ws.emit('pong received', { timeLapse })
      })
      ws.on('server connected', (e) => {
        this.connectTime.set(ws.index, e.timeLapse)
        this.connectingRoom.remove(ws.index)
      })
      ws.on('pong received', async (e) => {
        this.roundTripTime.push(e.timeLapse)
        // reduce the overshoot
        await new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
        if (this.roundTripTime.length < this.targetSampleSize) {
          ws.lastMessageSentAt = Date.now()
          ws.ping()
        } else {
          this.messagingRoom.remove(ws.id)
        }
      })
      this.clients.add(ws)
    }
  }
}

module.exports = Test
