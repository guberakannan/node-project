const modulesModel = require('../models/modules');
const userModel = require('../models/Users')
const { body, validationResult } = require('express-validator/check');
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${msg}`;
};

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('title', "Module Name is required").exists(),
                body('link', "Module Link is required").exists(),
                body('content', "Module content is required").exists(),
            ]
            break;
        case 'update':
            return [
                body('title', "Module Name is required").exists(),
                body('link', "Module Link is required").exists(),
                body('content', "Module content is required").exists(),
            ]
            break;

    }
}
exports.create = async (req, res) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
            return;
        }
        let moduleData = req.body;
        moduleData.link = "/user/pages/" + moduleData.link;
        moduleData.organization = req.admin.organization;
        modulesModel.findOne({ title: moduleData.title, organization: req.admin.organization }, { _id: 1 }, (err, result) => {
            if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });

            if (result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module already exists. Choose another name' } });
            modulesModel.create(moduleData, (err, result) => {
                if (err) {
                    res.status(500).json({ "success": false, errors: {message: err}, data: {} })
                } else {
                    res.status(200).json({ "success": true, errors: {}, data: result })
                }
            });
        });
    } catch (errors) {
        res.status(500).json({ "success": false, errors: {message: errors}, data: {} })
    }
}

// update module route
exports.update = async (req, res) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
            return;
        }
        const moduleData = req.body;

        modulesModel.findOne({ _id: { $ne: moduleData._id }, title: moduleData.title, organization: req.admin.organization }, { _id: 1 }, (err, result) => {
            if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });

            if (result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module already exists. Choose another name' } });

            modulesModel.findOne({ _id: moduleData._id, organization: req.admin.organization }, { _id: 1 }, (err, result) => {
                if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });

                if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module doesnot exists' } });
                moduleData.link = "/user/pages/" + moduleData.link
                modulesModel.update({ _id: result._id }, { title: moduleData.title, link: moduleData.link, content: moduleData.content, parent: moduleData.parent }, (err, result) => {
                    if (err) {
                        res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
                    } else {
                        res.json({ 'success': true, data: { "message": "User Details Updated Successfully" }, errors: {} });
                    }
                });
            });
        });
    } catch (errors) {
        res.status(500).json({ "success": false, errors: {message: errors}, data: {} })
    }
}

exports.fetch = (req, res) => {
    try {
        modulesModel.find({ organization: req.admin.organization }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, errors: err, data: {} })
            } else {
                res.status(200).json({ "success": true, errors: {}, data: result })
            }
        });

    } catch (errors) {
        res.status(500).json({ "success": false, errors: {message: errors}, data: {} })
    }
}
// delete module route
exports.delete = async (req, res) => {
    try {
        modulesModel.findOne({ _id: req.params.module, organization: req.admin.organization }, { _id: 1 }, (err, result) => {
            if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

            if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module doesnot exists' } })

            userModel.updateMany({ permittedModules: req.params.module }, { $pull: { permittedModules: req.params.module } }, (err, result) => {
                if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

                modulesModel.remove({ _id: req.params.module }, (err, result) => {
                    if (err) {
                        res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })
                    } else {
                        res.json({ 'success': true, data: { "message": "User deleted successfully" }, errors: {} });
                    }
                });
            });
        });

    } catch (errors) {
        res.status(500).json({ "success": false, errors: {message: errors}, data: {} })
    }
}