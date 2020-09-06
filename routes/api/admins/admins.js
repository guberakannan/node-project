const router = require('express').Router();
const adminAuth = require('../../adminAuth');
const superAdminAuth = require('../../superAdminAuth');
const adminsCntrl = require('../../../controllers/adminsCntrl');
const modulesCntrl = require('../../../controllers/modulesCntrl');
// create admin route
router.post('/', superAdminAuth.required, adminsCntrl.validate('create'), adminsCntrl.create);
// Update admin route
router.put('/', superAdminAuth.required, adminsCntrl.validate('update'), adminsCntrl.update);
// admin login route
router.post('/login', adminAuth.optional, adminsCntrl.validate('login'), adminsCntrl.login);
// Delete Admin
router.delete('/:identifier', superAdminAuth.required, adminsCntrl.validate('delete'), adminsCntrl.delete);
// Get all admins
router.get('/', superAdminAuth.required, adminsCntrl.fetch);
// Find specific admin detail
router.get('/find', superAdminAuth.required, adminsCntrl.find);
// Change Password route
router.put('/change-password', adminAuth.required, adminsCntrl.validate('passwordValidation'), adminsCntrl.changePassword);
// Get Modules
router.get('/get-modules', adminAuth.required, modulesCntrl.fetch);

module.exports = router;
