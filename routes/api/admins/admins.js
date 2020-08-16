const router = require('express').Router();
const adminAuth = require('../../adminAuth');
const adminsCntrl = require('../../../controllers/adminsCntrl')

// create new user route
router.post('/new-user', adminAuth.required,  adminsCntrl.validate('create'), adminsCntrl.create);
// admin login route
router.post('/login', adminAuth.optional, adminsCntrl.validate('login'), adminsCntrl.login);
// Get all admins
router.get('/', adminAuth.required, adminsCntrl.fetch);
// Find specific admin detail
router.get('/find', adminAuth.required, adminsCntrl.find);
// Change Password route
router.put('/change-password', adminAuth.required, adminsCntrl.validate('passwordValidation'), adminsCntrl.changePassword);

module.exports = router;