const SerialPort = require('serialport')

const port = new SerialPort('/dev/tty.usbmodem14421', {
  baudRate: 9600
})
port.open(() => {
  console.log('opened')
})

setInterval(() => {
  const data = port.read(8)
  if (data != null) {
    console.log('data:', data.toString('ascii'))
  }
}, 100)
