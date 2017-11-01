const Controller = require('./Controller')
const argv = require('minimist')(process.argv.slice(2)) // slice off 'node' and 'src/index.js'

let { port, s: scannerPath, d: dbPath, p: passwordPath } = argv

if (!port) {
  console.log('defaulting for port to 8080')
  port = 8080
}

if (!scannerPath) {
  console.error('Please provide a path to the usb connection')
  process.exit(1)
}

if (!dbPath) {
  console.log('defaulting for database path file to ./users.db')
  dbPath = './users.db'
}

if (!passwordPath) {
  console.log('defaulting for password file to ./password.txt')
  passwordPath = './password.txt'
}

const app = new Controller({
  dbPath,
  scannerPath,
  passwordPath,
  port,
})
