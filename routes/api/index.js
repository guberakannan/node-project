const express = require('express');
const router = express.Router();
router.use('/users', require('./users'));
router.use('/admins', require('./admins'));
router.use('/super-admins', require('./super-admins'));

module.exports = router;