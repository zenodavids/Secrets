require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ejs = require('ejs')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

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
  googleId: String,
  username: String,
  secret: String,
})

// hash and salt passwords and save the hash to our database
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

// sets up mongoose to use the schema
const User = new mongoose.model('user', userSchema)

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy())

// creates cookie
passport.serializeUser(async (user, done) => {
  try {
    const id = user.id
    done(null, id)
  } catch (error) {
    done(error)
  }
})

// use cookie
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

// ===========================================
// Todo -- https://www.passportjs.org/packages/passport-google-oauth20/
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // if login/sign up is successful, direct the user to this url
      callbackURL: 'http://127.0.0.1:3000/auth/google/secrets',
    },

    (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile.displayName)

        // ! "findOrCreate" is not a mongoDB function
        // TODO -- install package from https://www.npmjs.com/package/mongoose-findorcreate
        User.findOrCreate(
          { googleId: profile.id, username: profile.displayName },
          (err, user) => {
            return cb(err, user)
          }
        )
      } catch (error) {
        console.log(err)
      }
      // log the user profile
      console.log(profile)
    }
  )
)

// ===========================================

// routes
app.get('/', (req, res) => {
  res.render('home')
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

app.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect the secret page.
    res.redirect('/secrets')
  }
)

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

// if logged in, access this page. will use it for my gigly in a way that only logged in users can access this page. eg only logged in users can access a more detailed info about a job
// click on the secret button to take us to the secret page
// app.get('/secrets', (req, res) => {
//   req.isAuthenticated ? res.render('secrets') : res.render('login')
// })

// ! this will be seen by everyone whether they are logged in or not

// this will be seen by everyone
app.get('/secrets', async (req, res) => {
  try {
    // find all users who have submitted a secret
    const foundUsers = await User.find({ secret: { $ne: null } })

    // if no errors and users are found
    if (foundUsers) {
      // render the secrets page with the list of users who have submitted secrets
      res.render('secrets', { usersWithSecrets: foundUsers })
    }
  } catch (err) {
    // if there is an error, log it
    console.log('unable to find users with secrets', err)
  }
})

// click on the submit button to take us to the submit page
app.get('/submit', (req, res) => {
  req.isAuthenticated ? res.render('submit') : res.render('login')
})

// submit a secret and see what others also submitted
app.post('/submit', async (req, res) => {
  // get the secret submitted by the user
  const submittedSecret = req.body.secret

  // log the user id and username
  console.log(`user id is ========> ${req.user.id}`)
  console.log(`user username is ========> ${req.user.username}`)

  try {
    // find the logged in user by their id
    const foundUser = await User.findById(req.user.id)

    // if no errors and user is found,
    if (foundUser) {
      // allow them to submit a secret
      foundUser.secret = submittedSecret

      // save the user's updated secret
      await foundUser.save()

      // redirect the user to the secrets page
      res.redirect('/secrets')
    }
  } catch (err) {
    // if there is an error, log it
    console.log('unable to find user to post secret', err)
  }
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
