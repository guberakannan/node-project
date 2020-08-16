const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationsSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    logo: {
        type: String,
        default: '/api/static/organizations/org-logo.jpg'
    },
    lastUpdatedDate: {
        type: Date,
        default: Date.now
    }
}, {
    strict: false
});

exports.update = (condition, data, callback) => {
    const orgModel = mongoose.model('organizations', OrganizationsSchema);

    orgModel.update(condition, data, { upsert: true, setDefaultsOnInsert: true }, (err, result) => {
        callback(err, result);
    });
}

exports.create = (data, callback) => {
    let orgModel = mongoose.model('organizations', OrganizationsSchema);
    let newOrganization = new orgModel(data);

    newOrganization.save((err, result) => {
        callback(err, result);
    });
}

exports.find = (condition, projection, callback) => {
    const orgModel = mongoose.model('organizations', OrganizationsSchema);

    orgModel.find(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.findOne = (condition, projection, callback) => {
    const orgModel = mongoose.model('organizations', OrganizationsSchema);

    orgModel.findOne(condition, projection, (err, result) => {
        callback(err, result);
    });
}

exports.isValid = (value) => {
    const orgModel = mongoose.model('organizations', OrganizationsSchema);

    return orgModel.findOne(value).then(result => { return result })
}