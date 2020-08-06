const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dynamicSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique:true
    },
    organization: {
        type: String,
        required: true
    },
    schemaIdentifier: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
}, {
    strict: true
});

const schemaModel = mongoose.model('dynamicSchemas', dynamicSchema);

exports.update = (condition, data, callback) => {
    schemaModel.update(condition, data, { upsert: true, setDefaultsOnInsert: true }, (err, result) => {
        callback(err, result);
    });
}

exports.create = (data, callback) => {
    schemaModel.create(data, (err, result) => {
        callback(err, result);
    });
}

exports.find = (condition, projection, callback) => {
    schemaModel.find(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.findOne = (condition, projection, callback) => {
    schemaModel.findOne(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.remove = (condition, callback) => {
    schemaModel.remove(condition, (err, result) => {
        callback(err, result);
    });
}

exports.aggregate = (condition, callback) => {
    schemaModel.aggregate(condition, (err, result) => {
        callback(err, result);
    });
}

exports.isValidSchema = (value) => {
    return schemaModel.findOne(value).then(result => { return result })
}