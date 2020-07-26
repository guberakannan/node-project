const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const adminAuth = require('../adminAuth');
const _ = require('lodash')
const Users = mongoose.model('Users');
const orgModel = require('../../models/organizations')
const modulesModel = require('../../models/modules');
var async = require('async');

// create new user route
router.post('/new-user', adminAuth.required, (req, res) => {
  const { body: { user } } = req;

  if (!user.name) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        name: 'is required',
      },
    });
  }

  if (!user.password) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        password: 'is required',
      },
    });
  }

  if (!user.designation) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        designation: 'is required',
      },
    });
  }

  if (!user.organization) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        organization: 'is required',
      },
    });
  }

  Users.findOne({ name: user.name, userType: 'admin' }, { _id: 1 }, (err, result) => {
    if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

    if (result) return res.status(422).json({ success: false, data: {}, errors: { user: 'already exists' } })

    orgModel.findOne({ name: user.organization }, { name: 1 }, (err, result) => {
      if (result) {
        let userPwd = user.password;

        delete user.password
        user.userType = 'admin';
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
});
// admin login route
router.post('/login', adminAuth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if (!user.name) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        name: 'is required',
      },
    });
  }

  if (!user.password) {
    return res.status(422).json({
      success: false,
      data: {},
      errors: {
        password: 'is required',
      },
    });
  }

  // Attach user type
  user.role = "admin";
  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if (err) {
      return res.status(500).json({ 'success': false, data: {}, errors: {} });
    }

    if (passportUser) {
      let user = passportUser;
      user = user.toAuthJSON();
      orgModel.findOne({ name: user.organization }, { name: 1, logo: 1, _id: 0 }, (err, result) => {
        if (err) {
          return res.status(500).json({ 'success': false, data: {}, errors: {} });
        } else {
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
        }
      })

    } else {
      return res.status(401).json({ 'success': false, data: {}, errors: {} });
    }

  })(req, res, next);
});
// Get all admins
router.get('/', adminAuth.required, (req, res) => {
  Users.find({ userType: "admin" }, {}, (err, result) => {
    if (err) {
      res.status(500).json({ success: false, data: {}, errors: err });
    } else {
      res.status(200).json({ success: true, data: result, errors: {} });
    }
  });
});
// Find specific admin detail
router.get('/find', adminAuth.required, (req, res) => {
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
});
// Change Password route
router.put('/change-password', adminAuth.required, (req, res) => {

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
        return res.status(400).json({ success: false, data: {}, errors: {} })
      }
    });
});
// update user module route
router.put('/user-module', adminAuth.required, (req, res) => {
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
});

router.post('/module-permission', adminAuth.required, (req, res) => {
  let reqBody = req.body;
  if (reqBody.module != undefined && req.admin.id != undefined) {
    modulesModel.findOne({ link: reqBody.module }, {}, (err, moduleInfo) => {
      if (moduleInfo) {
        Users.findOne({ _id: req.admin.id, permittedModules: moduleInfo.title }, {}, (err, result) => {
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
});

module.exports = router;