const router = require('express').Router();
const superAdminAuth = require('../../superAdminAuth');
const superAdminCtrl = require('../../../controllers/superAdminCtrl');
// superadmin login route
router.post('/login', superAdminAuth.optional, superAdminCtrl.validate('login'), superAdminCtrl.login);
// Change Password route
router.put('/change-password', superAdminAuth.required, superAdminCtrl.validate('passwordValidation'), superAdminCtrl.changePassword);

module.exports = router;