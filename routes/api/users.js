const router = require('express').Router();
const auth = require('../auth');
const adminAuth = require('../adminAuth');
const usersCntrl = require('../../controllers/usersCntrl')
// Get all users
router.get('/', adminAuth.required, usersCntrl.fetch);
// Find specific user detail
router.get('/find', adminAuth.required, usersCntrl.find);
// create new user route
router.post('/', adminAuth.required, usersCntrl.validate('create'), usersCntrl.create);
// Update User
router.put('/', adminAuth.required, usersCntrl.validate('update'), usersCntrl.update);
// Delete User
router.delete('/:user', adminAuth.required, usersCntrl.delete);
// user login route
router.post('/login', auth.optional, usersCntrl.validate('login'), usersCntrl.login);
// Change Password route
router.put('/change-password', auth.required, usersCntrl.validate('passwordValidation'), usersCntrl.changePassword);

router.post('/module-permission', auth.required, usersCntrl.checkPermissions);

module.exports = router;