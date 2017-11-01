const Basy = require('basy')
const USBConnection = require('./USBConnection')
const api = require('./api')
const https = require('https')

const timeInDay = () => {
  const dayStart = new Date()
  datStart.setHours(0, 0, 0, 0)
  return new Date() - dayStart
}

const defaultOptions = {
  dbPath: null,
  scannerPath: null,
  passwordPath: null,
  port: 8080
}

module.exports = class Controller {
  constructor(options) {
    options = object.assign({}, defaultOptions, options)

    this.db = new Basy({
      path: options.dbPath,
      writeInterval: 1,
      indexes: ['_id', 'userID']
    })

    this.captureID = false

    this.connection = new USBConnection(options.scannerPath)

    this.connection.on('id', this.handleID)

    this.webserver = https
      .createServer(
        {
          key: options.key,
          cert: options.cert
        },
        api(this.db, options.passwordPath, this.captureID)
      )
      .listen(options.port)
  }

  handleID(id) {
    if (!this.captureID) {
      if (idHasAccess(id)) {
        // send signal to open door and to beep
        console.log('yes')
      } else {
        // send signal to do boop
        console.log('no')
      }
    }
  }

  idHasAccess(id) {
    const [person] = this.db.find(doc => doc.passIDs.includes(id))
    if (!person) {
      return false
    }
    // check times
    const time = timeInDay()

    if (time < person.startTime) {
      return false
    }

    if (time > person.endTime) {
      return false
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
    }).then(
      id => {
        this.captureID = false
        return id
      },
      err => {
        this.captureID = false
        throw err
      }
    )
  }
}

/**
 * structure of a database object
 *
 * {
 *   name: string,
 *   userID: string,
 *   passIDs: string[],
 *   startTime: number,
 *   endTime: number
 * }
 */
