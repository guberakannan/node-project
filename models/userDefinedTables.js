const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userDefinedTable = new Schema({
    name: {
        type: String
    }
}, {strict : false});

exports.update = (schemaName, condition, data, callback) => {
    const schemaModel = mongoose.model(schemaName, userDefinedTable, schemaName );
    schemaModel.update(condition, data, { upsert: true, setDefaultsOnInsert: true }, (err, result) => {
        callback(err, result);
    });
}

exports.create = (schemaName, data, callback) => {
    const schemaModel = mongoose.model(schemaName, userDefinedTable, schemaName );
    schemaModel.create(data, (err, result) => {
        callback(err, result);
    });
}

exports.find = (schemaName, condition, projection, callback) => {
    const schemaModel = mongoose.model(schemaName, userDefinedTable, schemaName );
    schemaModel.find(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.findOne = (schemaName, condition, projection, callback) => {
    const schemaModel = mongoose.model(schemaName, userDefinedTable, schemaName );
    schemaModel.findOne(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.remove = (schemaName, condition, callback) => {
    const schemaModel = mongoose.model(schemaName, userDefinedTable, schemaName );
    schemaModel.remove(condition, (err, result) => {
        callback(err, result);
    });
}

exports.aggregate = (schemaName, condition, callback) => {
    const schemaModel = mongoose.model(schemaName, userDefinedTable, schemaName );
    schemaModel.aggregate(condition, (err, result) => {
        callback(err, result);
    });
}