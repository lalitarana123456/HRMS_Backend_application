const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController.js');

const router = express.Router();

router.get('/analytics', getAnalytics);

module.exports = router;


/**
 Real-Time Analytics:
 ____________________
 postman:::GET :localhost:8000/api/attendance/analytics
 Response :
            {
                "analytics":
                        [
                            {"_id":"675275b8b876ffcdf69ee6d1",
                            "employeeId":"EMP001",
                            "date":"2024-12-06T03:55:36.119Z",
                            "workingHours":0.07735027777777778,
                            "totalBreakHours":0
                            },
                            {"_id":"6757c5c3d5b245ae6f580223",
                            "employeeId":"EMP002",
                            "date":"2024-12-10T04:38:27.154Z",
                            "workingHours":0.14826027777777778,
                            "totalBreakHours":0
                            }
                        ]
            }

 */