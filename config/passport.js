const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = mongoose.model('Users');

passport.use(new LocalStrategy({
  usernameField: 'user[name]',
  passwordField: 'user[password]',
  passReqToCallback: true
}, (req, name, password, done) => {
  Users.findOne({ name:name, userType : req.body.user.role})
    .then((user) => {
      if(!user || !user.validatePassword(password)) {
        return done(null, false, { errors: { 'name or password': 'is invalid' } });
      }

      return done(null, user);
    }).catch(done);
}));