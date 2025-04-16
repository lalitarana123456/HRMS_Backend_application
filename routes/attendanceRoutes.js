// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, roleAccess } = require('../middleware/authMiddleware');

// Route to handleAttendance
router.post('/handleAttendance', protect, attendanceController.handleAttendance);

//Route to getReal Time Timer
router.get('/checkin-time', protect, attendanceController.getTimer);

// Define the routes
router.get('/status', protect, attendanceController.getEmployeeStatus);

router.get('/status/:employeeId', protect, attendanceController.getEmployeeStatusByAdmin);


// Route to mark on leave
// router.post('/onleave/:employeeId', attendanceController.markOnLeave);

// // Route to get today's attendance
// router.get('/:employeeId', attendanceController.getTodayAttendance);

module.exports = router;