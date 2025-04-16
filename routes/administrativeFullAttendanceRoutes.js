// routes/employeeRoutes.js
const express = require('express');
const administrativeFullAttendanceController = require('../controllers/administrativeFullAttendanceController');
const router = express.Router();
const { protect, roleAccess } = require('../middleware/authMiddleware');




// Route for getting total employees and online employee count
router.get('/total-employees/present', protect,administrativeFullAttendanceController.getTotalEmployeesPresent);

//routes for for get checkout employess count
router.get('/pending-checkout/employees', protect, administrativeFullAttendanceController.getPendingCheckOutCount);

module.exports = router;