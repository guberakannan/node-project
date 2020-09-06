const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const passport = require('passport');
const UsersModel = require('../models/Users');
const orgModel = require('../models/organizations');
const _ = require('lodash')
const async = require('async');
const { body, param, validationResult } = require('express-validator/check');
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${msg}`;
};

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('user.name', "Email is required").exists(),
                body('user.organization', "Organization is required").exists(),
                body('user.name').custom(val => {
                    return UsersModel.isValid({ name: val, userType: 'admin' }).then(user => {
                        if (user) {
                            return Promise.reject('Email already taken. Please choose another one');
                        }
                    });
                }),
                body('user.organization').custom(val => {
                    return orgModel.isValid({ _id: val }).then(organization => {
                        if (!organization) {
                            return Promise.reject('Please add organization details before adding admin');
                        }
                    });
                })
            ]
            break;
        case 'update':
            return [
                body('name', "Email is required").exists(),
                body('organization', "Organization is required").exists(),
                body().custom(val => {
                    let cond = { name: val.name, _id: { $ne: val._id }, userType: 'admin' }
                    return UsersModel.isValid(cond).then(found => {
                        if (found) {
                            return Promise.reject('Email already taken. Please choose another one');
                        }
                    });
                }),
                body('organization').custom(val => {
                    return orgModel.isValid({ name: val }).then(organization => {
                        if (!organization) {
                            return Promise.reject('Please add organization details before adding admin');
                        }
                    });
                })
            ]
            break;
        case "delete":
            return [
                param('identifier').custom(val => {
                    return UsersModel.isValid({ _id: val, userType: "admin"}).then(found => {
                        if (!found) {
                            return Promise.reject('Invalid admin details sent');
                        }
                    });
                })
            ]
            break;
        case 'login':
            return [
                body('user.name', "Email is required").exists(),
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
// create new admin route
exports.create = async (req, res) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: { message: validResult.array()[0] }, data: {} });
            return;
        }

        const { body: { user } } = req;
        user.userType = 'admin';
        user.designation = 'Admin';
        const finalUser = new Users(user);

        finalUser.setPassword(user.password);

        return finalUser.save()
            .then(() => res.json({ success: true, data: finalUser.toAuthJSON(), errors: {} }))
            .catch(function (e) {
                if (e.code == "11000") {
                    res.status(422).json({
                        success: false,
                        data: {},
                        errors: {
                            message: 'User Email already exists',
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

    } catch (errors) {
        res.status(500).json({ "success": false, errors: { message: errors }, data: {} })
    }
};
// update admin route
exports.update = async (req, res) => {
    const validResult = await validationResult(req).formatWith(errorFormatter);
    if (!validResult.isEmpty()) {
        res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
        return;
    }
    const user = req.body;

    Users.findOne({ _id: user._id }, { _id: 1 }, (err, existing) => {
        if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });

        if (!existing) return res.status(422).json({ success: false, data: {}, errors: { message: 'User doesnot exists' } });

        orgModel.findOne({ name: user.organization }, { _id: 1 }, (err, result) => {
            if (err) {
                return res.status(500).json({ 'success': false, data: {}, errors: {} });
            } else {
                UsersModel.update({ _id: user._id }, { name: user.name, organization: result._id}, (err, result) => {
                    if (err) {
                        res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
                    } else {
                        res.json({ 'success': true, data: { "message": "Admin Details Updated Successfully" }, errors:{}});
                    }
                });
            }
        });
    });
}
// admin login route
exports.login = async (req, res, next) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
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
                            user.organization = result;
                            res.json({ 'success': true, data: user, errors: {} });
                        } else {
                            res.status(400).json({ 'success': false, data: {}, errors: { "message": "organization not found" } });
                        }
                    }
                });
            } else {
                return res.status(401).json({ 'success': false, data: {}, errors: {} });
            }
        })(req, res, next);
    } catch (errors) {
        res.status(500).json({ "success": false, errors: errors, data: {} })
    }
};

// Get all admins
exports.fetch = (req, res) => {
    orgModel.find({}, { name: 1, _id: 1 }, (err, organizations) => {
        if (!err) {
            Users.find({ userType: "admin" }, { name: 1, organization: 1 }, (err, users) => {
                if (err) {
                    res.status(500).json({ success: false, data: {}, errors: { message: err } });
                } else {
                    async.forEach(users, function (user, callback) {
                        let matchVal = organizations.find(x => x._id.toString() == user.organization.toString());
                        if (matchVal) {
                            user.organization = matchVal.name;
                        }
                        callback();
                    }, function (err, done) {
                        res.status(200).json({ success: true, data: users, errors: {} });
                    });
                }
            });
        } else {
            res.status(500).json({ success: false, data: {}, errors: { message: err } });
        }
    });
};
// Find specific admin detail
exports.find = (req, res) => {
    try {
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
    } catch (errors) {
        return res.status(500).json({ success: false, data: {}, errors: errors })
    }
};

exports.changePassword = async (req, res) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
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
    } catch (errors) {
        res.status(500).json({ success: false, data: {}, errors: errors })
    }
};
// delete admin route
exports.delete = async (req, res) => {
    try{
        UsersModel.remove({ _id: req.params.identifier }, (err, result) => {
            if (err) {
              res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })
            } else {
              res.json({ 'success': true, data: { "message": "Admin deleted successfully" }, errors: {} });
            }
          });
    }catch(errors){
        res.status(500).json({ success: false, data: {}, errors: { "message":  errors } })
    }
  }