const express = require('express')
const app = express()
const passport = require("passport");
const session = require("express-session");
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const mainRoutes = require('./routes/main')

require('dotenv').config({ path: './config/.env '})
const connectDB = require('./config/database')

require("./config/passport")(passport);

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(logger('dev'))

app.use(methodOverride("_method"));

app.use(passport.initialize());
app.use(passport.session());

connectDB().then(sequelize => {
  const SequelizeSessionStore = new SequelizeStore({ db: sequelize })

  app.use(session({
      key: 'session_cookie_name',
      secret: 'session_cookie_secret',
      store: SequelizeSessionStore,
      resave: false,
      saveUninitialized: false
  }));

  app.use(flash());

  app.use('/', mainRoutes)

  app.listen(process.env.PORT, () => {
      console.log(`Server is running, you better catch it!`)
  })
});
