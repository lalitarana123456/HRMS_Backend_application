const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/requestLeavesController');
const { protect, roleAccess } = require('../middleware/authMiddleware');

// Route to count pending leave types across all employees
router.get('/pending-leave-count', protect, leaveController.countPendingLeaveTypes);

module.exports = router;
