const express = require('express');
const router = express.Router();
router.use('/', require('./super-admins'));
router.use('/organizations', require('./organizations'));
module.exports = router;