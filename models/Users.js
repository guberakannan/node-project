const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UsersSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true,
    default: 'Admin'
  },
  organization: {
    type: String,
    required: true,
    default: 'AmagoPro'
  },
  lastUpdatedDate: {
    type: Date,
    default: Date.now
  },
  userType: {
    type: String,
    enum : ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  permittedModules: [],
  hash: String,
  salt: String,
}, {
  strict: true
});

UsersSchema.methods.setPassword = function (password) {
  console.log(password, this.name)
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
  let secret = "";
  switch(this.userType){
    case "user":
      secret = "Kq[=7g3QKfDTEpr";
      break;
    case "admin":
      secret = "_d3y%~PM.Y)jq?J";
      break;
    case "superadmin":
      secret = "VS7LYaW9L#54mDXz";
      break;
    default:
      secret = "Kq[=7g3QKfDTEpr";
      break;
  }

  return jwt.sign({
    name: this.name,
    id: this._id,
    organization: this.organization,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
  }, secret);
}

UsersSchema.methods.toAuthJSON = function () {

  return {
    id: this._id,
    name: this.name,
    designation: this.designation,
    organization: this.organization,
    modules: this.permittedModules,
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

exports.findOne = (condition, projection, callback) => {
  const userModel = mongoose.model('Users', UsersSchema);
  
  userModel.findOne(condition, projection, (err, result)=> {
      callback(err, result);
  });
}

exports.isValid = (value) => {
  const userModel = mongoose.model('Users', UsersSchema);

  return userModel.findOne(value).then(result => { return result })
}

exports.update = (condition, data, callback) => {
  const userModel = mongoose.model('Users', UsersSchema);

  userModel.update(condition, data, (err, result) => {
      callback(err, result);
  });
}

exports.updateMany = (condition, data, callback) => {
  const userModel = mongoose.model('Users', UsersSchema);

  userModel.updateMany(condition, data, (err, result) => {
      callback(err, result);
  });
}

exports.remove = (condition, callback) => {
  const userModel = mongoose.model('Users', UsersSchema);

  userModel.remove(condition, (err, result) => {
      callback(err, result);
  });
}

mongoose.model('Users', UsersSchema);