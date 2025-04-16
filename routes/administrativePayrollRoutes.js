const express = require('express');
//importing administartiveAttence controller file
const administrativePayroll = require('../controllers/administrativePayrollController');
const { protect, roleAccess } = require('../middleware/authMiddleware');


const router = express.Router();

//Get method for the department - wise attendance
router.post('/create-payroll/:employeeId', protect, administrativePayroll.createPayroll);

//Get method for the department - wise attendance
router.get('/getAllPayroll', protect, administrativePayroll.getAllPayrollHistory);

router.get('/downloadEmployeePayslipPDF/:employeeId', protect, administrativePayroll.downloadEmployeePayslipPDF);

module.exports = router;