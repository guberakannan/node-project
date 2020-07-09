const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const orgModel = require('./organizations')

const { Schema } = mongoose;

const UsersSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  hash: String,
  salt: String,
}, {
  strict: false
});

UsersSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UsersSchema.methods.generateJWT = function () {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign({
    name: this.name,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
  }, 'secret');
}

UsersSchema.methods.toAuthJSON = function () {

  return {
    name: this.name,
    designation: this.designation,
    organization: this.organization,
    token: this.generateJWT(),
  };
};

UsersSchema.methods.verifyPassword = (password, salt, hash) => {
  const hashUserInput = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
  return hashUserInput === hash;
};

UsersSchema.methods.getUser = function () {
  return {
    name: this.name,
    salt: this.salt,
    hash: this.hash
  };
};

mongoose.model('Users', UsersSchema);