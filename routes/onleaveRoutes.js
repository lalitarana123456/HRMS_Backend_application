const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/onleaveController');
const { protect, roleAccess } = require('../middleware/authMiddleware');

router.get('/approved-leaves', protect, leaveController.getApprovedLeaves);

module.exports = router;