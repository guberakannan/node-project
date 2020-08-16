const router = require('express').Router();
const auth = require('../auth');
const adminAuth = require('../adminAuth');
const usersCntrl = require('../../controllers/usersCntrl')

// create new user route
router.post('/new-user', adminAuth.required, usersCntrl.create);
// user login route
router.post('/login', auth.optional, usersCntrl.login);
// Get all users
router.get('/', adminAuth.required, usersCntrl.fetch);
// Find specific user detail
router.get('/find', adminAuth.required, usersCntrl.find);
// Change Password route
router.put('/change-password', auth.required, usersCntrl.changePassword);
// update user module route
router.put('/user-module', adminAuth.required, usersCntrl.updatePermissions);

router.post('/module-permission', auth.required, usersCntrl.checkPermissions);

module.exports = router;