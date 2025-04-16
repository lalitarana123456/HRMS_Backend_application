const express = require('express');
//importing administartiveAttence controller file
const { getDepartmenetWiseAttendance } = require('../controllers/administartiveAttendanceController');
const { protect, roleAccess } = require('../middleware/authMiddleware');



const router = express.Router();

//Get method for the department - wise attendance
router.get('/department-wise', protect, getDepartmenetWiseAttendance);



module.exports = router;




//ENDPOINTS/URL
/*
  GET - http://localhost:5000/api/v1/administartive/attendance/department-wise
  RESPONSE - 
  [
    {
        "department": "Front-End",
        "percentage": "9.09%"
    },
    {
        "department": "Back-End",
        "percentage": "9.09%"
    },
    {
        "department": "IT",
        "percentage": "4.55%"
    },
    {
        "department": "UI/UX",
        "percentage": "4.55%"
    }
]
*/