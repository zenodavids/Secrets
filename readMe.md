# Authentication and Authorization

Authentication methods using;

- mongoose-encryption,
- md5,
- bcrypt and
- passport.Js [ passport, passport-local, express-session and passport-local-mongoose ]

> **The best option is the last option**

## Using **mongoose-encryption** to encrypt passwords

```sh
npm i mongoose-encryption
```

```js
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const encrypt = require('mongoose-encryption')
const ejs = require('ejs')

const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// use mongoose to connect to mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true })

// ! Create user database
// Create a user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
})

// use the long unguessable string to encrypt the database
userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  //   array of variables to encrypt
  encryptedFields: ['password'],
})

const User = new mongoose.model('user', userSchema)

//? =========================== REgister Function
app.post('/register', (req, res) => {
  // sign up new users via the form in the register file
  const newUser = new User({
    // "username" here is the name attribute of the input html element for the email
    email: req.body.username,

    // "password" here is the name attribute of the input html element for the password
    password: req.body.password,
  })

  // function to save the new user...
  newUser
    .save()
    // ...and grant them access to the "secrets page"
    .then((user) => {
      res.render('secrets')
    })
    .catch((err) => {
      console.log(err, 'error while saving user')
    })
})

//? ===================End of REgister Function

//? =========================== Login function
// login users via the form in the login file
app.post('/login', async (req, res) => {
  // "username" here is the name attribute of the input html element for the email
  const username = req.body.username
  // "password" here is the name attribute of the input html element for the password
  const password = req.body.password

  try {
    // find a user with the inputed email
    const foundUser = await User.findOne({ email: username })

    // if the user is found, check if the password matches
    if (foundUser.password === password) {
      // if the password matches, grant access to the "secrets" page
      res.render('secrets')
    }
  } catch (err) {
    console.log(
      err,
      'there was an issue finding the email that matches the user'
    )
  }
})
//? =========================== end of Login function

app.listen(3000, () => {
  console.log('Server started on port 3000.')
})
```

## Using **md5** to hash passwords

```sh
npm i md5
```

```js
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ejs = require('ejs')
const md5 = require('md5')

const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// use mongoose to connect to mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true })

// ! Create user database
// Create a user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
})

const User = new mongoose.model('user', userSchema)

// routes
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/register', (req, res) => {
  res.render('register')
})

//? =========================== REgister Function
app.post('/register', (req, res) => {
  // sign up new users via the form in the register file
  const newUser = new User({
    // "username" here is the name attribute of the input html element for the email
    email: req.body.username,

    // "password" here is the name attribute of the input html element for the password
    // using md5() hashes the function
    password: md5(req.body.password),
  })

  // function to save the new user...
  newUser
    .save()
    // ...and grant them access to the "secrets page"
    .then((user) => {
      res.render('secrets')
    })
    .catch((err) => {
      console.log(err, 'error while saving user')
    })
})

//? ===================End of REgister Function

//? =========================== Login function
// login users via the form in the login file
app.post('/login', async (req, res) => {
  // "username" here is the name attribute of the input html element for the email
  const username = req.body.username
  // "password" here is the name attribute of the input html element for the password
  const password = md5(req.body.password)

  try {
    // find a user with the inputed email
    const foundUser = await User.findOne({ email: username })

    // if the user is found, check if the password matches
    if (foundUser.password === password) {
      // if the password matches, grant access to the "secrets" page
      res.render('secrets')
    }
  } catch (err) {
    console.log(
      err,
      'there was an issue finding the email that matches the user'
    )
  }
})
//? =========================== end of Login function

app.listen(3000, () => {
  console.log('Server started on port 3000.')
})
```

## Using **bcrypt** to combine passwords with salting then hash passwords

```sh
npm i bcrypt
```

```js
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ejs = require('ejs')
const bcrypt = require('bcrypt')

// number of times a password is salted
const saltRounds = 10

const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// use mongoose to connect to mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true })

// ! Create user database
// Create a user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
})

const User = new mongoose.model('user', userSchema)

// routes
app.get('/', (req, res) => {
  res.render('home')
})
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/register', (req, res) => {
  res.render('register')
})

//? =========================== REgister Function
app.post('/register', (req, res) => {
  // gets the password and the salt rounds and hashes them. the new password becomes the hash
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
    // hash is the hashed password
    const newUser = new User({
      // "username" here is the name attribute of the input html element for the email
      email: req.body.username,

      // "password" here is the name attribute of the input html element for the password

      password: hash,
    })

    // function to save the new user...
    newUser
      .save()
      // ...and grant them access to the "secrets page"
      .then((user) => {
        res.render('secrets')
      })
      .catch((err) => {
        console.log(err, 'error while saving user')
      })
  })
  // sign up new users via the form in the register file
})

//? ===================End of REgister Function

//? =========================== Login function
// login users via the form in the login file
app.post('/login', async (req, res) => {
  // "username" here is the name attribute of the input html element for the email
  const username = req.body.username
  // "password" here is the name attribute of the input html element for the password
  const password = req.body.password

  try {
    // find a user with the inputed email
    const foundUser = await User.findOne({ email: username })

    // if the user is found, check if the password matches
    bcrypt.compare(password, foundUser.password, function (err, result) {
      // if the hash matches
      if (result === true) {
        //  grant access to the "secrets" page
        res.render('secrets')
      }

      // result == true
    })
  } catch (err) {
    console.log(
      err,
      'there was an issue finding the email that matches the user'
    )
  }
})
//? =========================== end of Login function

app.listen(3000, () => {
  console.log('Server started on port 3000.')
})
```

## Using **passport, passport-local, express-session and passport-local-mongoose** to combine passwords with salting then hash passwords

```sh
npm i passport passport-local passport-local-mongoose express-session
```

```js
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ejs = require('ejs')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// initialize Session
app.use(
  session({ secret: 'keyboard cat', resave: false, saveUninitialized: false })
)

// initialize passport
app.use(passport.initialize())
// initialize passport to use the session package
app.use(passport.session())

// use mongoose to connect to mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true })

// ! Create user database
// Create a user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
})

// hash and salt paswords and save the hash to our database
userSchema.plugin(passportLocalMongoose)

// sets up mongoose to use the schema
const User = new mongoose.model('user', userSchema)

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy())

// creates cookie
passport.serializeUser(User.serializeUser())
// use cookie
passport.deserializeUser(User.deserializeUser())

// routes
app.get('/', (req, res) => {
  res.render('home')
})
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/register', (req, res) => {
  res.render('register')
})
app.get('/secrets', (req, res) => {
  req.isAuthenticated ? res.render('secrets') : res.render('login')
})

app.get('/logout', (req, res) => {
  req.logOut((err) => {
    err ? console.log(err, 'unable to log out') : res.redirect('/')
  })
})

//? =========================== REgister Function
// Sets up a POST route for registering a new user
app.post('/register', (req, res) => {
  // Calls the User model's register method to create a new user in the database
  User.register(
    { username: req.body.username }, // Uses the username from the request body
    req.body.password, // Uses the password from the request body
    (err, user) => {
      // Callback function that will be called after User.register finishes
      if (err) {
        // If there was an error, logs the error message to the console
        console.log(err, 'There was an error in registering user')
        // Redirects the user back to the registration page
        res.redirect('/register')
      } else {
        // If there was no error, authenticates the user with Passport's 'local' strategy
        passport.authenticate('local')(req, res, () => {
          // Redirects the user to the secrets page
          res.redirect('/secrets')
        })
      }
    }
  )
})

//? ===================End of REgister Function

//? =========================== Login function
// login users via the form in the login file
app.post('/login', async (req, res) => {
  const user = new User({
    username: req.body.username, // Uses the username from the request body
    password: req.body.password, // Uses the password from the request body
  })
  req.logIn(user, (err) => {
    err
      ? res.redirect('/login')
      : passport.authenticate('local')(req, res, () => {
          res.redirect('/secrets')
        })
  })
})
//? =========================== end of Login function

app.listen(3000, () => {
  console.log('Server started on port 3000.')
})
```

> To ensure that the user **MUST** sign in back once they log out, replace the following ;

```js
app.get('/secrets', (req, res) => {
  req.isAuthenticated ? res.render('secrets') : res.render('login')
})

app.get('/logout', (req, res) => {
  req.logOut((err) => {
    err ? console.log(err, 'unable to log out') : res.redirect('/')
  })
})
```

> with the below;

```js
// Modify the GET route for the secrets page
app.get('/secrets', (req, res) => {
  // Check if the user is authenticated AND a session with a logged-in user exists
  if (
    req.isAuthenticated() &&
    req.session.passport &&
    req.session.passport.user
  ) {
    // Render the secrets page if the user is authenticated and there's a logged-in session
    res.render('secrets')
  } else {
    // Redirect the user to the login page if they're not authenticated or there's no logged-in session
    res.redirect('/login')
  }
})

// Modify the GET route for logging out
app.get('/logout', (req, res) => {
  // Destroy the user's session to log them out
  req.session.destroy((err) => {
    if (err) {
      console.log(err, 'unable to log out')
    }
    // Redirect the user to the login page after logging them out
    res.redirect('/login')
  })
})
```
