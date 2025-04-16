const express = require("express");
const performance =  require("../controllers/performanceController");
const { protect, roleAccess } = require('../middleware/authMiddleware');

const router = express.Router();

// Monthly Performance Routes
router.post("/monthly/:employeeId", protect, performance.createMonthlyPerformance);
router.get("/monthly", protect, performance.getMonthlyPerformances);

// Yearly Performance Routes
router.post("/yearly/:employeeId", protect, performance.createYearlyPerformance);
router.get("/yearly", protect, performance.getYearlyPerformances);

router.get('/notifications',protect,performance.getNotifications)




module.exports = router;



/*
1)post-monthly 

Postman::POST ::localhost:8000/api/performance/monthly
Body :
{
  "overallPerformancePercentage": 85,
  "commentCategory": "Achievement",
  "commentText": "Met all quarterly goals and exceeded expectations."
}


Response:
{
    "overallPerformancePercentage": 85,
    "commentCategory": "Achievement",
    "commentText": "Met all quarterly goals and exceeded expectations.",
    "_id": "6764eabb08247fd8929ae9e7",
    "__v": 0
}

2)Get-Monthly:
Postman ::GET:localhost:8000/api/performance/monthly

Response:

[
    {
        "_id": "67640308ca8b08b918b9e566",
        "overallPerformancePercentage": 85,
        "commentCategory": "Achievement",
        "commentText": "Met all quarterly goals and exceeded expectations.",
        "__v": 0
    },
    {
        "_id": "6764eabb08247fd8929ae9e7",
        "overallPerformancePercentage": 85,
        "commentCategory": "Achievement",
        "commentText": "Met all quarterly goals and exceeded expectations.",
        "__v": 0
    }
]



3)Post-Yearly
Postman:::POST:localhost:8000/api/performance/yearly

Body:{
  "overallPerformancePercentage": 92,
  "commentCategory": "Recommendation",
  "commentText": "Outstanding performance throughout the year.",
  "taskCompletion": 5,
  "attendanceRating": 5,
  "efficiencyScore": 4,
  "teamCollaborationRating": 5
}

Response:{
    "overallPerformancePercentage": 92,
    "commentCategory": "Recommendation",
    "commentText": "Outstanding performance throughout the year.",
    "taskCompletion": 5,
    "attendanceRating": 5,
    "efficiencyScore": 4,
    "teamCollaborationRating": 5,
    "_id": "6764ebead07b11b9d3701c61",
    "__v": 0
}

4)Get-Yearly:
Postman:GET:::localhost:8000/api/performance/yearly

 Response:
[
    {
        "_id": "67640461ca8b08b918b9e56a",
        "overallPerformancePercentage": 92,
        "commentCategory": "Recommendation",
        "commentText": "Outstanding performance throughout the year.",
        "taskCompletion": 5,
        "attendanceRating": 5,
        "efficiencyScore": 4,
        "teamCollaborationRating": 5,
        "__v": 0
    },
    {
        "_id": "6764ebead07b11b9d3701c61",
        "overallPerformancePercentage": 92,
        "commentCategory": "Recommendation",
        "commentText": "Outstanding performance throughout the year.",
        "taskCompletion": 5,
        "attendanceRating": 5,
        "efficiencyScore": 4,
        "teamCollaborationRating": 5,
        "__v": 0
    }
]


 */