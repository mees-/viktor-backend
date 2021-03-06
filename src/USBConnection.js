const SerialPort = require('serialport')
const EventEmitter = require('events')
const fs = require('fs-extra')

module.exports = class USBConnection extends EventEmitter {
  constructor(path, options = { baudRate: 9600 }) {
    super()

    // check that the device exists
    // this throws if the path can't be accessedf
    fs.accessSync(path)

    this.port = new SerialPort(path, options)

    this.buffer = Buffer.from([])

    this.port.open(() => {
      this.port.on('data', data => {
        this.buffer = Buffer.concat([this.buffer, data])
        if (this.buffer.length >= 10) {
          const id = this.buffer.slice(0, 10)
          this.buffer = this.buffer.slice(10)

          this.emit('id', id.toString('ascii'))
        }
      })
    })
  }

  write(...args) {
    this.port.write(...args)
  }
}
