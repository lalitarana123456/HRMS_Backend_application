const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);

module.exports = router;
