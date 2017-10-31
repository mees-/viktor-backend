const SerialPort = require('serialport')
const EventEmitter = require('events')

module.exports = class USBConnection extends EventEmitter {
  constructor(path, options = { baudRate: 9600 }, pollRate = 50) {
    super()
    const port = new SerialPort(path, options)
    port.open(() => {
      this.poll_interval = setInterval(() => {
        const data = port.read(10)
        if (data != null) {
          this.emit('id', data)
        }
      }, pollRate)
    })
  }
}
