const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash')
const Users = mongoose.model('Users');
const orgModel = require('../models/organizations')
const userModel = require('../models/Users')
const modulesModel = require('../models/modules');
const async = require('async');
const activitylogsModel = require('../models/activityLogs')
const { body, validationResult } = require('express-validator/check');
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${msg}`;
};

exports.validate = (method) => {
  switch (method) {
    case 'create':
      return [
        body('user.name', "Email is required").exists(),
        body('user.name', "Invalid Email format").isEmail(),
        body('user.designation', "Designation is required").exists(),
        body('user.password', "Password is required").exists(),
        body('user.name').custom(val => {
          return userModel.isValid({ name: val, userType: 'user' }).then(user => {
            if (user) {
              return Promise.reject('Email already taken. Please choose another one');
            }
          });
        })
      ]
      break;
    case 'update':
      return [
        body('name', "Email is required").exists(),
        body('_id', "Invalid user details sent").exists(),
        body('name', "Invalid Email format").isEmail(),
        body('designation', "Designation is required").exists()
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
// create new user route
exports.create = async (req, res) => {
  try {
    const validResult = await validationResult(req).formatWith(errorFormatter);
    if (!validResult.isEmpty()) {
      res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
      return;
    }
    const { body: { user } } = req;
    user.organization = req.admin.organization;

    Users.findOne({ name: user.name, userType: 'user', organization: user.organization }, { _id: 1 }, (err, result) => {
      if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

      if (result) return res.status(422).json({ success: false, data: {}, errors: { message: 'User already exists' } })

      orgModel.findOne({ _id: user.organization }, { name: 1 }, (err, result) => {
        if (result) {
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
                    message: 'Name already exists',
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
        } else {
          return res.status(422).json({
            success: false,
            data: {},
            errors: {
              message: "Please add organization details before adding user",
            }
          });
        }
      })
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
  }
}
// create new user route
exports.update = async (req, res) => {
  try{
    const validResult = await validationResult(req).formatWith(errorFormatter);
    if (!validResult.isEmpty()) {
      res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
      return;
    }
    const user = req.body;
  
    Users.findOne({ name: user.name, _id: { $ne: user._id }, userType: 'user', organization: req.admin.organization }, { _id: 1 }, (err, result) => {
      if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
  
      if (result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Email already Taken' } });
  
      Users.findOne({ _id: user._id, userType: 'user', organization: req.admin.organization }, {}, (err, result) => {
        if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
  
        if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'User doesnot exists' } });
  
        userModel.update({ _id: result._id }, { name: user.name, designation: user.designation, permittedModules: user.permittedModules }, (err, updated) => {
          if (err) {
            res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
          } else {
            if(user.password != "" && user.password != undefined){
              const finalUser = new Users(result);
              finalUser.setPassword(user.password);
    
              return finalUser.save()
                .then(() => res.json({ 'success': true, data: { "message": "User Details Updated Successfully" }, errors: {} }))
            }else{
              res.json({ 'success': true, data: { "message": "User Details Updated Successfully" }, errors: {} })
            }
          }
        });
      });
    });
  }catch(error){
    return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
  }
}
// delete user route
exports.delete = async (req, res) => {
  Users.findOne({ _id: req.params.user, userType: 'user', organization: req.admin.organization }, { _id: 1 }, (err, result) => {
    if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

    if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'User doesnot exists' } })

    userModel.remove({ _id: req.params.user }, (err, result) => {
      if (err) {
        res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })
      } else {
        res.json({ 'success': true, data: { "message": "User deleted successfully" }, errors: {} });
      }
    });
  });
}
// user login route
exports.login = async (req, res, next) => {
  const validResult = await validationResult(req).formatWith(errorFormatter);
  if (!validResult.isEmpty()) {
    res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
    return;
  }
  const { body: { user } } = req;
  // Attach user type
  user.role = "user";
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
          if (user.modules.length) {
            let userMods = [];
            _.forEach(user.modules, (module) => {
              modulesModel.findOne({ _id: module }, { title: 1, parent: 1, link: 1, _id: 0 }, (err, moduleResponse) => {
                userMods.push(moduleResponse);
                if (userMods.length == user.modules.length) {
                  user.modules = userMods;
                  user.organization = result;
                  return res.json({ 'success': true, data: user, errors: {} });
                }
              });
            });
          } else {
            return res.status(400).json({ 'success': false, data: {}, errors: { "message": "No Modules assigned. Contact Administrator" } });
          }
        }
      });
    } else {
      return res.status(401).json({ 'success': false, data: {}, errors: {} });
    }

  })(req, res, next);
}
// Get all users
exports.fetch = async (req, res) => {
  Users.find({ userType: "user", organization: req.admin.organization }, { hash: 0, salt: 0, organization: 0, __v: 0, userType: 0 }, (err, result) => {
    if (err) {
      res.status(500).json({ success: false, data: {}, errors: err });
    } else {
      res.status(200).json({ success: true, data: result, errors: {} });
    }
  });
}
// Find specific user detail
exports.find = async (req, res) => {
  if (req.query && req.query != undefined && req.query != {}) {
    req.query.userType = "user";
    req.query.organization = req.admin.organization;
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
    res.status(422).json({ success: false, data: {}, errors: { "message": "Please resend request with required parameters" } });
  }
}
// Change Password route
exports.changePassword = async (req, res) => {

  const validResult = await validationResult(req).formatWith(errorFormatter);
  if (!validResult.isEmpty()) {
    res.status(422).json({ "success": false, errors: validResult.array()[0], data: {} });
    return;
  }

  let reqBody = req.body;
  let password = reqBody.currentPassword;
  Users.findById(req.user.id)
    .then((userinfo) => {
      let userRecord = new Users(userinfo)
      let validated = userRecord.verifyPassword(password, userinfo.salt, userinfo.hash);
      if (validated) {
        userRecord.setPassword(reqBody.password);

        return userRecord.save()
          .then(() => res.json({ success: true, data: userRecord.toAuthJSON(), errors: {} }));
      } else {
        return res.status(400).json({ success: false, data: {}, errors: {} })
      }
    });
}
// validate user module route
exports.checkPermissions = async (req, res) => {
  let reqBody = req.body;
  if (reqBody.module != undefined && req.user.id != undefined) {
    modulesModel.findOne({ link: reqBody.module }, {}, (err, moduleInfo) => {
      if (moduleInfo) {
        Users.findOne({ _id: req.user.id, permittedModules: moduleInfo._id.toString() }, {}, (err, result) => {
          if (result) {
            let pageTitle = (moduleInfo.pageTitle) ? moduleInfo.pageTitle: "Dynamic Module Title";
            activitylogsModel.create({user : req.user.name, module: moduleInfo.title, organization: req.user.organization}, (err, result)=>{})
            res.status(200).json({ success: true, data: {content: moduleInfo.content, title: pageTitle}, errors: {} });
          } else {
            res.status(401).json({ success: false, data: {}, errors: { "message": "Permission Denied" } });
          }
        })
      } else {
        res.status(400).json({ success: false, data: {}, errors: { "message": "Module doesn't exists" } });
      }
    });
  }
}