const express = require('express');
const { registerCompany } = require('../controllers/adminCompanyIdController'); 
const { protect, roleAccess } = require('../middleware/authMiddleware');

const router = express.Router();

// Define POST /register route
router.post('/register', protect, roleAccess(['Admin']), registerCompany);

module.exports = router;