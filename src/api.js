const express = require('express')
const fs = require('fs-extra')
const hasha = require('hasha')
const uuid = require('uuid')
const morgan = require('morgan')

module.exports = function makeServer(db, passwordPath, captureID) {
  const app = express()
  fs
    .readFile(passwordPath, { encoding: 'utf-8' })
    .then(file => {
      const [hash, salt] = file.split('\n')
      app.locals.hash = hash
      app.locals.salt = salt
      console.log('read a password with hash', hash)
    })
    .catch(async err => {
      // use the default password
      const password = 'this is a very good password'
      const salt = uuid()
      const saltedPassword = `${password}${salt}`
      const hash = hasha(saltedPassword)
      await fs.writeFile(passwordPath, `${hash}\n${salt}`)
      app.locals.hash = hash
      app.locals.salt = salt

      console.log('setup a default password')
    })

  // add a requets logger to the server
  app.use(morgan('dev'))
  // this middleware will make sure all requests are authenticated
  app.use((req, res, next) => {
    const password = req.headers['x-auth']

    if (password) {
      // check if valid
      const saltedPassword = `${password}${app.locals.salt}`
      const hash = hasha(saltedPassword)
      if (hash === app.locals.hash) {
        next()
      } else {
        console.log(password)
        res.status(401).end('Bad credentials')
      }
    } else {
      res.status(401).end('Bad credentials')
    }
  })

  app.get('/entries', async (req, res) => {
    const allEntries = await db.find({})
    res.json(allEntries)
  })

  app.put('/adminpassword', async (req, res) => {
    const newPassword = req.query.password
    if (newPassword) {
      const salt = uuid()
      const saltedPassword = `${newPassword}${salt}`
      const hash = hasha(saltedPassword)
      await fs.writeFile(passwordPath, `${hash}\n${salt}`)

      app.locals.hash = hash
      app.locals.salt = salt

      res.status(200).end('Changed the admin password')
    } else {
      res.status(400).end('Specify a password in the query params')
    }
  })

  app.delete('/pass', async (req, res) => {
    const user = await db.findOne({
      username: req.query.username,
    })

    if (user.passIDs.includes(req.query.pass)) {
      const newUser = {
        ...user,
        passIDs: user.passIDs.filter(id => id !== req.query.pass),
      }
      await db.update({ username: req.query.username }, newUser)

      res.status(200).end('Removed')
    } else {
      res.status(400).end('User does not have this pass')
    }
  })

  app.put('/pass', async (req, res) => {
    const user = await db.findOne({
      username: req.query.username,
    })
    if (user) {
      try {
        const pass = await captureID()
        console.log('pass:', pass)
        if (!await db.findOne({ passIDs: { $elemMatch: pass } })) {
          const newUser = {
            ...user,
            passIDs: [...user.passIDs, pass],
          }

          await db.update({ username: req.query.username }, newUser)

          res.status(200).end('Added pass')
        } else {
          // TODO: status code
          res.status(400).end('pass is already associated with a user')
        }
      } catch (e) {
        if (e.code === 6969) {
          res.status(400).end('Please scan the pass within 10 seconds')
        }
      }
    } else {
      res.status(404).end('User not found')
    }
  })

  app.post('/user', async (req, res) => {
    const existingUser = await db.findOne({ username: req.query.username })
    if (!existingUser) {
      const user = {
        username: req.query.username,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        passIDs: [],
      }

      await db.insert(user)
      res.status(200).end('Added user')
    } else {
      console.log(existingUser)
      res.status(400).end('Username already in use')
    }
  })

  app.delete('/user', async (req, res) => {
    await db.remove({ username: req.query.username })
    res.status(200).end('Deleted user')
  })

  return app
}
