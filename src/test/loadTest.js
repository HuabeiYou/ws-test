const { writeFileSync } = require('fs')
const WebSocket = require('ws')
const { mapToCSV, WaitingRoom } = require('./utils')
const SERVER_URL = 'ws://137.184.236.245:9000'
const INCREMENT = 1000
const MAX_CLIENTS = INCREMENT * 10
const TARGET_SAMPLE_SIZE = MAX_CLIENTS
const MESSAGE = JSON.stringify({ event: 'ping' })
// all time variables are in the unit of milliseconds

const clients = new Set()
const connectTime = new Map()
const roundTripTime = new Map()
const connectingRoom = new WaitingRoom()
const messagingRoom = new WaitingRoom()

function createClient(index) {
  connectingRoom.add(index)
  const ws = new WebSocket(SERVER_URL, {
    perMessageDeflate: false,
  })
  ws.index = index
  ws.createdAt = Date.now()
  ws.on('message', function (data) {
    const message = JSON.parse(data)
    if (message.event === 'open') {
      this.id = message.id
      const timeLapse = Date.now() - this.createdAt
      this.emit('server connected', { index: this.index, timeLapse })
    } else if (message.event === 'pong') {
      const timeLapse = Date.now() - this.lastMessageSentAt
      this.emit('pong received', { id: this.id, timeLapse })
    }
  })
  ws.on('eroor', function (e) {
    console.error(e)
    ws.close()
  })
  return ws
}

async function setupTest(targetClientSize) {
  roundTripTime.set(targetClientSize, [])
  console.log(`Start testing with ${targetClientSize} clients...`)
  clients.forEach((ws) => {
    ws.targetClientSize = targetClientSize
  })
  // First we increase total client count
  while (clients.size < targetClientSize) {
    const ws = createClient(clients.size + 1)
    ws.targetClientSize = targetClientSize
    ws.on('server connected', function (e) {
      connectTime.set(e.index, e.timeLapse)
      connectingRoom.delete(e.index)
    })
    ws.on('pong received', async function (e) {
      roundTripTime.get(this.targetClientSize).push(e.timeLapse)
      // reduce the overshoot
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
      if (
        roundTripTime.get(this.targetClientSize).length < TARGET_SAMPLE_SIZE
      ) {
        this.lastMessageSentAt = Date.now()
        this.send(MESSAGE)
      } else {
        messagingRoom.delete(this.id)
      }
    })
    clients.add(ws)
  }
}

async function main() {
  let targetClientSize = INCREMENT
  await setupTest(targetClientSize)
  connectingRoom.on('room cleared', () => {
    console.log(`All clients connected, current count: ${clients.size}`)
    clients.forEach((ws) => {
      messagingRoom.add(ws.id)
      ws.lastMessageSentAt = Date.now()
      ws.send(MESSAGE)
    })
  })
  messagingRoom.on('room cleared', async () => {
    writeFileSync(
      `RoundTripTime_${targetClientSize}.txt`,
      roundTripTime.get(targetClientSize).join('\n')
    )
    if (targetClientSize < MAX_CLIENTS) {
      targetClientSize += INCREMENT
      await setupTest(targetClientSize)
    } else {
      console.log('Test has been completed')
      writeFileSync(`ConnectTime.txt`, mapToCSV(connectTime))
      clients.forEach((ws) => {
        ws.close()
      })
      clients.clear()
      process.exit(0)
    }
  })
}

main()
