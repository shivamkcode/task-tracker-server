const express = require('express')
const app = express()
const passport = require("passport");
const session = require("express-session");
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const connectDB = require('./config/database')
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");

require('dotenv').config({ path: './config/.env '})

require("./config/passport")(passport);

connectDB()

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(logger('dev'))

app.use(methodOverride("_method"));

app.use(passport.initialize());
app.use(passport.session());

let SequelizeSessionStore = new SequelizeStore({ db: connectDB })

app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: SequelizeSessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running, you better catch it!`)
})