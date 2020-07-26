const express = require('express');
const router = express.Router();
router.use('/users', require('./users'));
router.use('/admins', require('./admins'));
router.use('/organizations', require('./organizations'));
router.use('/modules', require('./modules'));

module.exports = router;