const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const orgModel = require('../../models/organizations')

//POST new user route (optional, everyone has access)
router.post('/new-user', (req, res, next) => {

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

  const finalUser = new Users(user);

  finalUser.setPassword(user.password);

  return finalUser.save()
    .then(() => res.json({ success : true, data: finalUser.toAuthJSON(), errors: {} }));
});

//POST login route (optional, everyone has access)
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

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      return res.json({ 'success' : true, data: user.toAuthJSON(), errors: {} });
    });
});

module.exports = router;
