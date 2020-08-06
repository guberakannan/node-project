const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const expressValidator = require('express-validator')
//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;
require('./config/db');

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();

//Configure our app
var corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
      callback(null, true)
  }
}
app.use(cors(corsOptions));
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api/static', express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-kpitoday', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));
app.use(expressValidator())

if(!isProduction) {
  app.use(errorHandler());
}

//Models & routes
require('./models/Users');
require('./config/passport');
app.use(require('./routes'));

//Error handlers & middlewares
if(!isProduction) {
  app.use((err, req, res) => {
    // res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    });
  });
}

app.use((err, req, res) => {
  // res.status(err.status || 500);
  res.json({
    errors: {
      message: 'Internal server Error',
      error: {},
    },
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000/'));

