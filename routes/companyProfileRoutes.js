const express = require('express');
const multer = require('multer');
const companyProfileController = require('../controllers/companyProfileController');
const { protect, roleAccess } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes
router.put('/reg', protect, companyProfileController.updateCompany);

// Routes to get company profile
router.get('/', protect, companyProfileController.getCompanyProfileDetails);

module.exports = router;