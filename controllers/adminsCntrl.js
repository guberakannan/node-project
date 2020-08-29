const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const passport = require('passport');
const UsersModel = require('../models/Users');
const orgModel = require('../models/organizations');
const modulesModel = require('../models/modules');
const _ = require('lodash')
const { body, validationResult } = require('express-validator/check');
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${msg}`;
};

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('user.name', "Name is required").exists(),
                body('user.designation', "Designation is required").exists(),
                body('user.organization', "Organization is required").exists(),
                body('user.name').custom(val => {
                    return UsersModel.isValid({ name: val, userType: 'admin' }).then(user => {
                        if (user) {
                            return Promise.reject('Name already taken. Please choose another one');
                        }
                    });
                }),
                body('user.organization').custom(val => {
                    return orgModel.isValid({ name: val }).then(organization => {
                        if (!organization) {
                            return Promise.reject('Please add organization details before adding user');
                        }
                    });
                })
            ]
            break;
        case 'login':
            return [
                body('user.name', "Name is required").exists(),
                body('user.password', "Password is required").exists(),

            ]
            break;
        case 'passwordValidation':
            return [
                body('password', "Password is required").exists(),
                body('currentPassword', "Current password is required").exists()

            ]
            break;
    }
}

exports.create = async (req, res) => {
    // create new user route
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, error: validResult.array()[0], data: {} });
            return;
        }

        orgModel.findOne({ name: req.body.user.organization }, { _id: 1 }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                const { body: { user } } = req;

                let userPwd = "palAdmin";
                user.userType = 'admin';
                user.permittedModules = ["admins/dynamic-tables"];
                user.organization = result._id;
                const finalUser = new Users(user);

                finalUser.setPassword(userPwd);

                return finalUser.save()
                    .then(() => res.json({ success: true, data: finalUser.toAuthJSON(), errors: {} }))
                    .catch(function (e) {
                        if (e.code == "11000") {
                            res.status(422).json({
                                success: false,
                                data: {},
                                errors: {
                                    name: 'already exists',
                                }
                            });
                        } else {
                            res.status(422).json({
                                success: false,
                                data: {},
                                errors: {
                                    message: e.errmsg,
                                }
                            });
                        }
                    })
            }

        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ "success": false, error: error, data: {} })
    }
};

// admin login route
exports.login = async (req, res, next) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, error: validResult.array()[0], data: {} });
            return;
        }

        const { body: { user } } = req;
        // Attach user type
        user.role = "admin";
        return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
            if (err) {
                return res.status(500).json({ 'success': false, data: {}, errors: {} });
            }

            if (passportUser) {
                let user = passportUser;
                user = user.toAuthJSON();

                orgModel.findOne({ _id: user.organization }, { name: 1, logo: 1, _id: 0 }, (err, result) => {
                    if (err) {
                        return res.status(500).json({ 'success': false, data: {}, errors: {} });
                    } else {
                        if (result) {
                            let userMods = [];
                            _.forEach(user.modules, (module) => {
                                modulesModel.findOne({ title: module }, { title: 1, parent: 1, link: 1, _id: 0 }, (err, moduleResponse) => {
                                    userMods.push(moduleResponse);
                                    if (userMods.length == user.modules.length) {
                                        user.modules = userMods;
                                        user.organization = result;
                                        return res.json({ 'success': true, data: user, errors: {} });
                                    }
                                });
                            });
                        } else {
                            return res.status(400).json({ 'success': false, data: {}, errors: { "message": "organization not found" } });
                        }
                    }
                });

            } else {
                return res.status(401).json({ 'success': false, data: {}, errors: {} });
            }

        })(req, res, next);

    } catch (error) {
        console.log(error)
        res.status(500).json({ "success": false, error: error, data: {} })
    }
};

// Get all admins
exports.fetch = (req, res) => {
    Users.find({ userType: "admin" }, {}, (err, result) => {
        if (err) {
            res.status(500).json({ success: false, data: {}, errors: err });
        } else {
            res.status(200).json({ success: true, data: result, errors: {} });
        }
    });
};

// Find specific admin detail
exports.find = (req, res) => {
    if (req.query && req.query != undefined && req.query != {}) {
        req.query.userType = "admin";
        Users.find(req.query, {}, (err, result) => {
            if (err) {
                res.status(500).json({ success: false, data: {}, errors: err });
            } else {
                if (result.length) {
                    res.status(200).json({ success: true, data: result, errors: {} });
                } else {
                    res.status(204).json({ success: true, data: [], errors: {} });
                }
            }
        });
    } else {
        res.status(422).json({ success: false, data: {}, errors: { "message": "Please resend request with user parameters" } });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, error: validResult.array()[0], data: {} });
            return;
        }
        let reqBody = req.body;
        let password = reqBody.currentPassword;

        Users.findById(req.admin.id)
            .then((userinfo) => {
                let userRecord = new Users(userinfo)
                let validated = userRecord.verifyPassword(password, userinfo.salt, userinfo.hash);
                if (validated) {
                    userRecord.setPassword(reqBody.password);

                    return userRecord.save()
                        .then(() => res.json({ success: true, data: userRecord.toAuthJSON(), errors: {} }));
                } else {
                    return res.status(400).json({ success: false, data: {}, errors: { "message": "Incorrect Password" } })
                }
            })
            .catch(function (e) {
                return res.status(500).json({ success: false, data: {}, errors: e })
            });
    } catch (error) {
        return res.status(500).json({ success: false, data: {}, errors: e })
    }
};