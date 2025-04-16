const express = require('express');
//importing administartiveAttence controller file
const administrativeLeaveController = require('../controllers/administrativeLeaveController');
const { protect, roleAccess } = require('../middleware/authMiddleware');


const router = express.Router();

//Get method for the department - wise attendance
router.get('/pending-leaves', protect, administrativeLeaveController.getAllPendingLeaveEmployees);

router.get('/leave-details/:leaveId', protect, administrativeLeaveController.getLeaveRequestDetailsForAdminEmployer);

router.get('/profile-details/:employeeId', administrativeLeaveController.getEmployeeProfile);

router.get('/document/download/:employeeId/:leaveIndex/:fileIndex', protect, administrativeLeaveController.downloadLeaveDocument);


module.exports = router;