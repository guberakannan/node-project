const express = require('express');
const router = express.Router();
router.use('/users', require('./users'));
router.use('/organizations', require('./organizations'));


module.exports = router;