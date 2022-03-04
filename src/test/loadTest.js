const { writeFileSync } = require('fs')
const WebSocket = require('ws')
const SERVER_URL = 'ws://137.184.236.245:9000'
const INCREMENT = 1000
const MAX_CLIENTS = INCREMENT * 5
const TARGET_SAMPLE_SIZE = MAX_CLIENTS
// all time variables are in the unit of milliseconds
const CONNECT_INTERVAL = 10
const MESSAGE = JSON.stringify({ event: 'ping' })

const mapToCSV = (mapObj) => {
  const csvArr = []
  mapObj.forEach((value, key) => {
    csvArr.push(`${key},${value}`)
  })
  return csvArr.join('\n')
}

async function loadTest() {
  const clients = new Set()
  const connectTime = new Map()
  for (
    let targetClientSize = INCREMENT;
    targetClientSize <= MAX_CLIENTS;
    targetClientSize += INCREMENT
  ) {
    const messageInterval = targetClientSize * CONNECT_INTERVAL
    console.log(`Start testing ${targetClientSize} clients...`)
    // First we increase total client count
    const measurements = []
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
          measurements.push(Date.now() - ws.lastMessageSentAt)
          ws.lastMessageSentAt = 0
        }
      })
      clients.add(ws)
      await new Promise((resolve) => {
        setTimeout(resolve, CONNECT_INTERVAL)
      })
    }
    console.log(`Client set populated, current count: ${clients.size}`)
    // wait a little bit to make sure all connections are established
    await new Promise((resolve) => {
      setTimeout(resolve, messageInterval)
    })
    // taking measurements
    const maxSampleCount = Math.floor(TARGET_SAMPLE_SIZE / targetClientSize)
    console.log(`maxSampleCount: ${maxSampleCount}`)
    for (let i = 0; i < maxSampleCount; i++) {
      console.log('sample #', i + 1)
      let count = 0
      clients.forEach((client) => {
        client.lastMessageSentAt = Date.now()
        client.send(MESSAGE)
        count += 1
      })
      console.log(count, 'messages sent')
      await new Promise((resolve) => {
        setTimeout(resolve, messageInterval)
      })
      console.log('current measurement count:', measurements.length)
    }
    console.log(`${measurements.length} measurements collected`)
    writeFileSync(
      `RoundTripTime_${targetClientSize}.txt`,
      measurements.join('\n')
    )
    console.log(`Test with ${targetClientSize} clients has finished.`)
  }
  writeFileSync(`ConnectTime.txt`, mapToCSV(connectTime))
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
