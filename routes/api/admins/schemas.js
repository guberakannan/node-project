const router = require('express').Router();
const schemaCntrl = require('../../../controllers/schemaCntrl')
const adminAuth = require('../../adminAuth');

router.post('/', adminAuth.required, schemaCntrl.validate('create'), schemaCntrl.create);
router.get('/', adminAuth.required, schemaCntrl.fetch);
router.put('/', adminAuth.required, schemaCntrl.validate('update'), schemaCntrl.update);
router.delete('/:id', adminAuth.required, schemaCntrl.validate('delete'), schemaCntrl.delete);

module.exports = router;