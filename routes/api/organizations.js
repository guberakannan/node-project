const router = require('express').Router();
const organizationsCntrl = require('../../controllers/organizationsCntrl')

router.post('/', organizationsCntrl.create);
router.get('/', organizationsCntrl.fetch);


module.exports = router;
