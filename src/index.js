const Controller = require('./Controller')

const app = new Controller({
  dbPath: './users.db',
  scannerPath: '/dev/tty.usbmodem14621',
  passwordPath: './password.donttouchthisandalsodontlookisdangerouse',
})
