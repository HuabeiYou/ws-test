const EventEmitter = require('events')

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
    this.space.add(id)
  }
  delete(id) {
    this.space.delete(id)
    if (this.space.size === 0) {
      this.emit('room cleared')
    }
  }
}

module.exports = {
  mapToCSV,
  WaitingRoom,
}
