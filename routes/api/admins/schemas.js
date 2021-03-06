const router = require('express').Router();
const schemaCntrl = require('../../../controllers/schemaCntrl')
const adminAuth = require('../../adminAuth');

router.post('/', adminAuth.required, schemaCntrl.validate('create'), schemaCntrl.create);
router.get('/', adminAuth.required, schemaCntrl.fetch);
router.get('/active', adminAuth.required, schemaCntrl.fetchActive);
router.put('/', adminAuth.required, schemaCntrl.validate('update'), schemaCntrl.update);
router.delete('/:schemaIdentifier', adminAuth.required, schemaCntrl.validate('delete'), schemaCntrl.delete);

module.exports = router;