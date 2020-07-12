const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const orgModel = require('../../models/organizations')

// create new user route
router.post('/new-user', auth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if(!user.name) {
    return res.status(422).json({
      success : false,
      data: {},
      errors: {
        name: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      success : false,
      data: {},
      errors: {
        password: 'is required',
      },
    });
  }

  if(!user.designation) {
    return res.status(422).json({
      success : false,
      data: {},
      errors: {
        designation: 'is required',
      },
    });
  }

  if(!user.organization) {
    return res.status(422).json({
      success : false,
      data: {},
      errors: {
        organization: 'is required',
      },
    });
  }

  let userPwd = user.password;

  delete user.password
  const finalUser = new Users(user);
  
  finalUser.setPassword(userPwd);

  return finalUser.save()
    .then(() => res.json({ success : true, data: finalUser.toAuthJSON(), errors: {} }));
});

// user login route
router.post('/login', auth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if(!user.name) {
    return res.status(422).json({
      success : false,
      data: {},
      errors: {
        name: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      success : false,
      data: {},
      errors: {
        password: 'is required',
      },
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return res.status(500).json({ 'success' : false, data: {}, errors: {} });
    }

    if(passportUser) {
      let user = passportUser;
      user = user.toAuthJSON();
      orgModel.findOne({name: user.organization}, {name:1, logo:1, _id:0}, (err, result)=>{
        if(err){
          return res.status(500).json({ 'success' : false, data: {}, errors: {} });
        }else{
          user.organization = result;
          return res.json({ 'success' : true, data: user, errors: {} });
        }
      });
    }else{
      return res.status(401).json({ 'success' : false, data: {}, errors: {} });
    }

  })(req, res, next);
});

// Change Password route
router.put('/change-password', auth.required, (req, res, next) => {

  let reqBody = req.body;
  let password = reqBody.currentPassword;
  Users.findById(req.user.id)
    .then((userinfo) => {
      let userRecord = new Users(userinfo)
      let validated = userRecord.verifyPassword(password, userinfo.salt, userinfo.hash);
      
      if(validated){
        userRecord.setPassword(reqBody.password);

        return userRecord.save()
          .then(() => res.json({ success : true, data: userRecord.toAuthJSON(), errors: {} }));
      }else{
        return res.status(400).json({ success : false, data: {}, errors: {} })
      }
    });
});

router.put('/user-module', auth.optional, (req, res, next) => {

  let reqBody = req.body;

  Users.update({_id: reqBody.id}, {permittedModules: reqBody.permittedModules}, (err, result) => {
    if(err){
      res.status(500).json({ success : false, data: {}, errors: err });
    }else{
      res.status(200).json({ success : true, data: {}, errors: {} });
    }
  });
});

module.exports = router;

