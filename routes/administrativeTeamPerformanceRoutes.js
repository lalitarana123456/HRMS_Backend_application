const express = require("express");
const router = express.Router();
const administrativeTeamPerformance = require("../controllers/administrativeTeamPerformanceController");
const { protect, roleAccess } = require('../middleware/authMiddleware');

// Route to fetch overall team performance
router.get("/designation-wise", protect, administrativeTeamPerformance.getDesignationWisePerformance);

router.get("/YearlyAndMonthlyPerformance/:employeeId", administrativeTeamPerformance.getPerformanceData);

module.exports = router;