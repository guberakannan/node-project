const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash')
const Users = mongoose.model('Users');
const orgModel = require('../models/organizations')
const userModel = require('../models/Users')
const modulesModel = require('../models/modules');
var async = require('async');

// create new user route
exports.create = async (req, res) => {
  const { body: { user } } = req;
  user.organization = req.admin.organization;
  if (!user.name) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'Email is required',
      },
    });
  }

  if (!user.designation) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'Designation is required',
      },
    });
  }

  if (!user.password) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'Password is required',
      },
    });
  }

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
}
// create new user route
exports.update = async (req, res) => {

  const user = req.body;
  
  if (!user._id) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'Invalid Data',
      },
    });
  }

  if (!user.name) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'Email is required',
      },
    });
  }

  if (!user.designation) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'Designation is required',
      },
    });
  }

  Users.findOne({ _id: user._id, userType: 'user', organization : req.admin.organization }, { _id: 1 }, (err, result) => {
    if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' }});

    if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: ' User doesnot exists' } });

    userModel.update({_id: result._id}, {name: user.name, designation: user.designation, permittedModules: user.permittedModules}, (err, result) => {
      if(err){
        res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
      }else{
        res.json({ 'success': true, data: {"message": "User Details Updated Successfully"}, errors: {} });
      }
    });
  });
}
// delete user route
exports.delete = async (req, res) => {
  Users.findOne({ _id: req.params.user, userType: 'user', organization : req.admin.organization }, { _id: 1 }, (err, result) => {
    if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

    if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'User doesnot exists' } })

    userModel.remove({_id: req.params.user}, (err, result) => {
      if(err){
        res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })
      }else{
        res.json({ 'success': true, data: {"message": "User deleted successfully"}, errors: {} });
      }
    });
  });
}
// user login route
exports.login = async (req, res, next) => {
  const { body: { user } } = req;

  if (!user.name) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'name is required',
      },
    });
  }

  if (!user.password) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        message: 'password is required',
      },
    });
  }

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
          if(user.modules.length){
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
          }else{
            return res.status(400).json({ 'success': false, data: {}, errors: {"message": "No Modules assigned. Contact Administrator"} });
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
  Users.find({userType: "user", organization: req.admin.organization}, {hash:0, salt:0, organization:0, __v:0, userType:0}, (err, result) => {
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
// update user module route
exports.updatePermissions = async (req, res) => {
  let reqBody = req.body;
  if (reqBody.permittedModules != undefined) {
    async.eachSeries(reqBody.permittedModules, function (module, modulescallback) {
      modulesModel.findOne({ title: module }, { _id: 1 }, (err, result) => {
        if (result) {
          modulescallback()
        } else {
          return res.status(422).json({ success: false, data: {}, errors: { 'message': "Invalid Modules Sent" } });
        }
      });

    }, function (done) {
      Users.update({ _id: reqBody.id }, { permittedModules: reqBody.permittedModules }, (err, result) => {
        if (err) {
          res.status(500).json({ success: false, data: {}, errors: err });
        } else {
          res.status(200).json({ success: true, data: {}, errors: {}, message: "Updated Successfully" });
        }
      });
    });

  } else {
    res.status(422).json({ success: false, data: {}, errors: { "message": "Please resend request with modules parameter" } });
  }
}
// validate user module route
exports.checkPermissions = async (req, res) => {
  let reqBody = req.body;
  if (reqBody.module != undefined && req.user.id != undefined) {
    modulesModel.findOne({ link: reqBody.module }, {}, (err, moduleInfo) => {
      if (moduleInfo) {
        Users.findOne({ _id: req.user.id, permittedModules: moduleInfo._id.toString() }, {}, (err, result) => {
          if (result) {
            res.status(200).json({ success: true, data: moduleInfo.content, errors: {} });
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