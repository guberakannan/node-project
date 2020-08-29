const express = require('express');
const router = express.Router();
router.use('/', require('./admins'));
router.use('/schema', require('./schemas'))
router.use('/table-data', require('./schemaData'))
router.use('/modules', require('./modules'));

module.exports = router;