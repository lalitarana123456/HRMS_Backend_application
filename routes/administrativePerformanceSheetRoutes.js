const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/administrativePerformanceSheetController');
const { protect, roleAccess } = require('../middleware/authMiddleware');


// API to get all employee performance data
router.get('/performance-data',protect, performanceController.getAllPerformanceData);

// API to get performance data by Employee ID
router.get('/performance-data/:id', performanceController.getPerformanceByEmployeeId);

module.exports = router;