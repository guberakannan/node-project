const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activityLogsSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    organization:{
        type: Schema.Types.ObjectId,
        required: true
    }

}, {
    timestamps: true
}, {
    strict: true
});

const activitylogsModel = mongoose.model('activitylogs', activityLogsSchema);

exports.create = (data, callback) => {
    activitylogsModel.create(data, (err, result) => {
        callback(err, result);
    });
}

exports.findOne = (condition, projection, callback) => {
    activitylogsModel.findOne(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.aggregate = (condition, callback) => {
    activitylogsModel.aggregate(condition, (err, result) => {
      callback(err, result);
    });
  }