const organizationModel = require('../models/organizations');
const { header, body, param, validationResult } = require('express-validator/check');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('name', "Organization name is required").exists()
            ]
            break;
        case 'delete':
            return [
                param('identifier').custom(val => {
                    return organizationModel.isValid({ _id: val }).then(found => {
                        if (!found) {
                            return Promise.reject('Invalid details sent');
                        }
                    });
                })
            ]
            break;
    }
}
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${msg}`;
};

exports.create = async (req, res) => {
    try {
        const result = await validationResult(req).formatWith(errorFormatter);
        if (!result.isEmpty()) {
            res.status(422).json({ "success": false, errors: { message: result.array()[0] }, data: {} });
            return;
        }

        if (!req.file) {
            res.status(422).json({ "success": false, errors: { message: "Please upload logo" }, data: {} })
        }

        req.body.logoname = req.file.originalname;
        let filePath = req.file.path.replace(/\\/g, "/");
        req.body.logo = '/api/static/' + filePath.split('public/')[1];

        organizationModel.create(req.body, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, errors: { message: err }, data: {} })
            } else {
                res.status(200).json({ "success": true, errors: {}, data: {} })
            }
        });
    } catch (errors) {
        res.status(500).json({ "success": false, errors: { message: errors }, data: {} })
    }
}

exports.update = (req, res) => {
    try {
        if (req.file) {
            req.body.logoname = req.file.originalname;
            let filePath = req.file.path.replace(/\\/g, "/");
            req.body.logo = '/api/static/' + filePath.split('public/')[1];
        }

        organizationModel.update({ _id: req.body._id }, req.body, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, errors: { message: err }, data: {} })
            } else {
                res.status(200).json({ "success": true, errors: {}, data: {} })
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
                res.status(500).json({ "success": false, errors: { message: err }, data: {} })
            } else {
                res.status(200).json({ "success": true, errors: {}, data: result })
            }
        });
    } catch (errors) {
        res.status(500).json({ "success": false, errors: { message: errors }, data: {} })
    }
}

exports.delete = async (req, res) => {
    try {
        const validationOut = await validationResult(req).formatWith(errorFormatter);
        if (!validationOut.isEmpty()) {
            res.status(422).json({ "success": false, error: { message: validationOut.array()[0] }, data: {} });
            return;
        }

        res.status(200).json({ "success": true, errors: {}, data: {} })
    }catch(errors){
        res.status(500).json({ "success": false, errors: { message: errors }, data: {} })
    }
}