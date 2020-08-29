const router = require('express').Router();
const adminAuth = require('../../adminAuth');
const adminsCntrl = require('../../../controllers/adminsCntrl');
const modulesCntrl = require('../../../controllers/modulesCntrl');
// create new user route
router.post('/new-user', adminAuth.optional,  adminsCntrl.validate('create'), adminsCntrl.create);
// admin login route
router.post('/login', adminAuth.optional, adminsCntrl.validate('login'), adminsCntrl.login);
// Get all admins
router.get('/', adminAuth.required, adminsCntrl.fetch);
// Find specific admin detail
router.get('/find', adminAuth.required, adminsCntrl.find);
// Change Password route
router.put('/change-password', adminAuth.required, adminsCntrl.validate('passwordValidation'), adminsCntrl.changePassword);
// Get Modules
router.get('/get-modules', adminAuth.required, modulesCntrl.fetch);

module.exports = router;
