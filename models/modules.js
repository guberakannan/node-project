const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModulesSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  parent: {
    type: String
  },
  link: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  organization: {
    type: String,
    required: true,
  }
}, {
  strict: true
});

const modulesModel = mongoose.model('modules', ModulesSchema);

exports.update = (condition, data, callback) => {
  modulesModel.update(condition, data, { upsert: true, setDefaultsOnInsert: true }, (err, result) => {
    callback(err, result);
  });
}

exports.create = (data, callback) => {
  modulesModel.create(data, (err, result) => {
    callback(err, result);
  });
}

exports.find = (condition, projection, callback) => {
  modulesModel.find(condition, projection, (err, result) => {
    callback(err, result);
  });
}

exports.findOne = (condition, projection, callback) => {
  modulesModel.findOne(condition, projection, (err, result) => {
    callback(err, result);
  });
}

exports.aggregate = (condition, callback) => {
  modulesModel.aggregate(condition, (err, result) => {
    callback(err, result);
  });
}

exports.remove = (condition, callback) => {
  modulesModel.remove(condition, (err, result) => {
    callback(err, result);
  });
}