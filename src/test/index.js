const Test = require('./Test')
const INCREMENT = 100
const MAX_CLIENTS = INCREMENT * 10

function runTest(targetClientSize) {
  const test = new Test({ targetClientSize, targetSampleSize: MAX_CLIENTS })
  test.on('finished', () => {
    const increaseClientSize = targetClientSize + INCREMENT
    if (increaseClientSize > MAX_CLIENTS) {
      console.log('All test cases have been completed!')
      process.exit(0)
    } else {
      runTest(increaseClientSize)
    }
  })
  test.start()
}

runTest(INCREMENT)
