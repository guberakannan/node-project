const router = require('express').Router();
const organizationsCntrl = require('../../controllers/organizationsCntrl')

router.post('/', organizationsCntrl.create);

module.exports = router;
