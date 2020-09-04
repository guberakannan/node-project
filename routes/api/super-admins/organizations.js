const router = require('express').Router();
const organizationsCntrl = require('../../../controllers/organizationsCntrl')
const superAdminAuth = require('../../superAdminAuth');

router.post('/', organizationsCntrl.create);
router.get('/', organizationsCntrl.fetch);

module.exports = router;