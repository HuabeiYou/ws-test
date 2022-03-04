const { writeFileSync } = require('fs')
const WebSocket = require('ws')
const SERVER_URL = 'ws://localhost:9000'
const INCREMENT = 100
const MAX_CLIENTS = INCREMENT * 1
const TARGET_SAMPLE_SIZE = MAX_CLIENTS * 2
// all time variables are in the unit of milliseconds
const CONNECT_INTERVAL = 10
const MESSAGE_INTERVAL = 10 * 1000
const MESSAGE = JSON.stringify({ event: 'ping' })

async function loadTest() {
  const connectTime = new Map()
  const roundTripTime = new Map()
  const clients = new Set()
  for (
    let targetClientSize = INCREMENT;
    targetClientSize <= MAX_CLIENTS;
    targetClientSize += INCREMENT
  ) {
    console.log(`Start testing ${targetClientSize} clients...`)
    // First we increase total client count
    const measurements = []
    if (!roundTripTime.has(targetClientSize)) {
      roundTripTime.set(targetClientSize, measurements)
    }
    while (clients.size < targetClientSize) {
      const ws = new WebSocket(SERVER_URL, {
        perMessageDeflate: false,
      })
      ws.index = clients.size
      ws.createdAt = Date.now()
      ws.on('message', (data) => {
        const message = JSON.parse(data)
        if (message.event === 'open') {
          connectTime.set(ws.index, Date.now() - ws.createdAt)
          ws.id = message.id
        } else if (message.event === 'pong' && ws.lastMessageSentAt) {
          measurements
            .push(Date.now() - ws.lastMessageSentAt)
          ws.lastMessageSentAt = 0
        }
      })
      clients.add(ws)
      await new Promise((resolve) => {
        setTimeout(resolve, CONNECT_INTERVAL)
      })
    }
    // taking measurements
    const maxSampleCount = Math.floor(TARGET_SAMPLE_SIZE / targetClientSize)
    for (let i = 0; i < maxSampleCount; i++) {
      clients.forEach((client) => {
        client.lastMessageSentAt = Date.now()
        client.send(MESSAGE)
      })
      await new Promise((resolve) => {
        setTimeout(resolve, MESSAGE_INTERVAL)
      })
    }
    await new Promise((resolve) => {
      setTimeout(resolve, MESSAGE_INTERVAL)
    })
    writeFileSync(
      `RoundTripTime_${targetClientSize}.txt`,
      roundTripTime.get(targetClientSize).join('\n')
    )
    console.log(`Test with ${targetClientSize} clients has finished.`)
  }
  const mapToCSV = []
  connectTime.forEach((value, key) => {
    mapToCSV.push(`${key},${value}`)
  })
  writeFileSync(`ConnectTime.txt`, mapToCSV.join('\n'))
  // tear down
  clients.forEach((ws) => {
    ws.close()
  })
  clients.clear()
}

async function main() {
  await loadTest()
  process.exit(0)
}

main()
