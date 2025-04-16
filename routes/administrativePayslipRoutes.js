const express = require('express');
const router = express.Router();
const { getEmployeeDetails } = require('../controllers/administrativePayslipsController');

// Route for fetching employee details
router.get('/employees/details', getEmployeeDetails);

module.exports = router;