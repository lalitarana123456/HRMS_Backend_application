const express = require('express');
const router = express.Router();
const employeeIdController = require('../controllers/employeeidController');
const { protect, roleAccess } = require('../middleware/authMiddleware');

// Route to create a new employee id 
router.post('/create', protect, employeeIdController.createEmployee);


// Route to edit a employee
router.put('/edit-profile', protect, employeeIdController.editEmployee);


//get employee proifile 
router.get('/employee-profile/:employeeId', protect, employeeIdController.getProfile);

//employee get profile
router.get("/api/profile", protect, employeeIdController.getProfile);

//console.log(upload.arguments);

module.exports = router;