const express = require('express');
const router = express.Router();

const { protect, roleAccess } = require('../middleware/authMiddleware');
const upcomingLeaveController = require('../controllers/upcomingLeaveController');

//Admin: creating Upcoming leave
router.post('/create', protect, upcomingLeaveController.createUpcomingLeave);

//Employee: Get upcoming leaves
router.get('/',  upcomingLeaveController.getUpcomingLeaves);

router.get('/getFixedPublicLeaves', upcomingLeaveController.getFixedPublicHolidays);

router.get("/upcoming-leaves", upcomingLeaveController.getAllUpcomingLeaves);


module.exports = router;