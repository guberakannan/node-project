const organizationModel = require('../models/organizations');
const upload = require("../middleware/file-uploader");

exports.create = (req, res) => {
    // await upload(req, res);

    organizationModel.create(req.body, (err, result) => {
        if (err) {
            res.status(500).json({ "success": false, error: err, data: {} })
        } else {
            res.status(200).json({ "success": true, error: {}, data: result })
        }
    });
}

exports.fetch = (req, res) => {
    organizationModel.find(req.body, (err, result) => {
        if(err){
            res.status(500).json({"success": false, error: err, data: {}})
        }else{
            res.status(200).json({"success": true, error: {}, data: result})
        }
    });
}