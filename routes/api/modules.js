const router = require('express').Router();
const modulesCntrl = require('../../controllers/modulesCntrl')

router.post('/', modulesCntrl.create);
router.get('/', modulesCntrl.fetch);

module.exports = router;
