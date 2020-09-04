const organizationModel = require('../models/organizations');
// const upload = require("../middleware/file-uploader");

exports.create = (req, res) => {
    // await upload(req, res);
    try {
        organizationModel.create(req.body, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} })
            } else {
                res.status(200).json({ "success": true, error: {}, data: result })
            }
        });

    } catch (errors) {
        res.status(500).json({ "success": false, errors: { message: errors }, data: {} })
    }
}

exports.fetch = (req, res) => {
    try {
        organizationModel.find({}, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} })
            } else {
                res.status(200).json({ "success": true, error: {}, data: result })
            }
        });
    } catch (errors) {
        res.status(500).json({ "success": false, errors: { message: errors }, data: {} })
    }
}