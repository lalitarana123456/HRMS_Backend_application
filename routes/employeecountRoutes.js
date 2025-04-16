const express = require('express');
const { getTotalEmployees,getFullTimeEmployeeCount, getLeaveEmployeeCount, getInternEmployeeCount} = require('../controllers/employeecountController');
const router = express.Router();
const { protect, roleAccess } = require('../middleware/authMiddleware');


router.get('/count' , protect, getTotalEmployees);
router.get('/fulltime/count', protect, getFullTimeEmployeeCount);
router.get('/leaves/count', protect, getLeaveEmployeeCount);
router.get('/Intern/count' , protect, getInternEmployeeCount)
//http://localhost:5000/api/v1/employees/count?companyId=A6O3 api for integrating 

module.exports = router ;