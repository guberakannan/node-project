const router = require('express').Router();
const modulesCntrl = require('../../../controllers/modulesCntrl')
const adminAuth = require('../../adminAuth');

router.post('/', adminAuth.required, modulesCntrl.create);
router.get('/', adminAuth.required, modulesCntrl.fetch);
router.put('/', adminAuth.required, modulesCntrl.update);
router.delete('/:module', adminAuth.required, modulesCntrl.delete);


module.exports = router;
