const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const passport = require('passport');
const orgModel = require('../models/organizations');
const _ = require('lodash')
const { body, validationResult } = require('express-validator/check');
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${msg}`;
};

exports.validate = (method) => {
    switch (method) {
        case 'login':
            return [
                body('user.name', "Email is required").exists(),
                body('user.password', "Password is required").exists()
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

// super-admin login route
exports.login = async (req, res, next) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
            return;
        }

        const { body: { user } } = req;
        // Attach user type
        user.role = "superadmin";
        return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
            if (err) {
                return res.status(500).json({ 'success': false, data: {}, errors: {} });
            }

            if (passportUser) {
                let user = passportUser;
                user = user.toAuthJSON();
                orgModel.findOne({ _id: user.organization }, { name: 1, logo: 1, _id: 0 }, (err, result) => {
                    if (err) {
                        res.status(500).json({ 'success': false, data: {}, errors: {} });
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
                res.status(401).json({ 'success': false, data: {}, errors: {} });
            }

        })(req, res, next);
    } catch (errors) {
        res.status(500).json({ "success": false, errors: errors, data: {} })
    }
};
// change password

exports.changePassword = async (req, res) => {
    try {
        const validResult = await validationResult(req).formatWith(errorFormatter);
        if (!validResult.isEmpty()) {
            res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
            return;
        }
        let reqBody = req.body;
        let password = reqBody.currentPassword;

        Users.findById(req.superadmin.id)
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
                res.status(500).json({ success: false, data: {}, errors: e })
            });
    } catch (errors) {
        res.status(500).json({ success: false, data: {}, errors: errors })
    }
};