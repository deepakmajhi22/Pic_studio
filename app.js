require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const flash = require("connect-flash");
var app = express();
const passport = require('passport');
const session = require('express-session');



app.set('view engine', 'ejs');

// Trust proxy for Render deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const MongoStore = require('connect-mongo');

app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Pinterest1" }),
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || "hellohello",
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());



passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await usersRouter.findById(id);
  done(null, user);
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
