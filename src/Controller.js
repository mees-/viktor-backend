const Datastore = require('nedb-promise')
const USBConnection = require('./USBConnection')
const api = require('./api')
const https = require('http')

const timeInDay = () => {
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  return new Date() - dayStart
}

const defaultOptions = {
  dbPath: null,
  scannerPath: null,
  passwordPath: null,
  port: 8080,
}

module.exports = class Controller {
  constructor(options) {
    options = {
      ...defaultOptions,
      ...options,
    }

    this.db = new Datastore({
      filename: options.dbPath,
      autoload: true,
    })

    this.capture = false
    try {
      this.connection = new USBConnection(options.scannerPath)
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EACCES') {
        console.error('Cannot access the usb device')
        process.exit(1)
      }
    }

    this.connection.on('id', this.handleID.bind(this))

    this.webserver = api(this.db, options.passwordPath, this.captureID.bind(this)).listen(options.port, () => {
      console.log(`started listening on port: ${options.port}`)
    })
  }

  async idHasAccess(id) {
    const person = await this.db.findOne({ passIDs: { $elemMatch: id } })
    if (!person) {
      return false
    }
    // check times
    const time = timeInDay()

    if (time > person.startTime) {
      return true
    }

    if (time < person.endTime) {
      return true
    }

    return false
  }

  async handleID(id) {
    if (!this.capture) {
      if (await this.idHasAccess(id)) {
        // send signal to open door and to beep
        this.connection.write('1')
      } else {
        // send signal to do boop
        this.connection.write('0')
      }
    }
  }

  captureID() {
    return new Promise((resolve, reject) => {
      // make sure the scanner can't get stuck in 'add pass mode' forever by adding a timeout
      setTimeout(() => {
        const err = new Error('Timeout. No pass was detected')
        err.code = 6969
        reject(err)
      }, 10000)
      this.connection.once('id', resolve)
      this.capture = true
    }).then(
      id => {
        this.capture = false
        this.connection.write('1')
        return id
      },
      err => {
        this.capture = false
        throw err
      },
    )
  }
}

/**
 * structure of a database object
 *
 * {
 *   username: string, (primary key)
 *   passIDs: string[],
 *   startTime: number,
 *   endTime: number
 * }
 */
