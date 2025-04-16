// routes/employeeRoutes.js
const express = require('express');
const {getAttendanceRecords, updateAttendance, exportAttendance, filterAttendanceRecords} = require('../controllers/attendanceRecordsController');
const router = express.Router();
const { protect, roleAccess } = require('../middleware/authMiddleware');



//get method for the employee attendance
router.get('/employee-attendance',protect, getAttendanceRecords);


//put method for the updating employee attendance
router.put('/update-attendance', protect, updateAttendance);

//get method for the exporting employee attendance
router.get('/export-attendance', protect, exportAttendance);

//get method for filtering attendance record
router.get('/filter-attendance', protect, filterAttendanceRecords);

module.exports = router;