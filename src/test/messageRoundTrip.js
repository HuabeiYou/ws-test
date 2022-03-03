require('dotenv').config()
const fs = require('fs')
const WebSocket = require('ws')
const SERVER_URL = 'ws://localhost:9000'
const MAX_CLIENTS = 500
const INCREMENT = 500
const TARGET_SAMPLE_SIZE = 20000
// all time variables are in the unit of milliseconds
const CONNECT_INTERVAL = 10
const MESSAGE_INTERVAL = 10 * 1000

const roundTripTime = []
const connectTime = new Map()
const clients = new Set()

const createClient = (index, currentTime) => {
  const ws = new WebSocket(SERVER_URL, {
    perMessageDeflate: false,
  })
  ws.on('open', () => {
    connectTime.set(index, Date.now() - currentTime)
  })
  ws.interval = setInterval(() => {
    ws.lastMessageSentAt = Date.now()
    ws.send(JSON.stringify({ event: 'ping' }))
  }, MESSAGE_INTERVAL)
  ws.on('close', () => {
    if (ws.interval) {
      clearInterval(ws.interval)
    }
  })
  ws.on('message', (data) => {
    console.log(JSON.parse(data))
    // if (ws.lastMessageSentAt) {
    //   roundTripTime.push(Date.now() - ws.lastMessageSentAt)
    //   ws.lastMessageSentAt = 0
    // }
  })
  return ws
}

async function main() {
  let targetClientSize = 500
  while (targetClientSize <= MAX_CLIENTS) {
    // increase clients and measure connecting time
    while (clients.size < targetClientSize) {
      const newWS = createClient(clients.size, Date.now())
      clients.add(newWS)
      await new Promise((resolve) => {
        setTimeout(resolve, CONNECT_INTERVAL)
      })
    }
    targetClientSize += INCREMENT
  }
  setInterval(() => {
    console.log(connectTime)
    clients.forEach((ws) => {
      ws.close()
    })
    clients.clear()
    process.exit(0)
  }, MESSAGE_INTERVAL * 2)
}
main()
// setInterval(() => {
//   fs.writeFile(
//     `RoundTripTime_${MAX_CLIENTS}.txt`,
//     roundTripTime.join('\n'),
//     (err) => {
//       if (err) {
//         console.error(err)
//       }
//       console.log(`Test for ${MAX_CLIENTS} Clients finished`)
//       process.exit(0)
//     }
//   )
// }, TEST_DURATION)
