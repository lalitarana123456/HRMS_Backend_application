const express = require('express');
const router = express.Router();
const { protect, roleAccess } = require('../middleware/authMiddleware');



const {
    addEmployee,
    removeEmployees,
    getAlignedEmployees,
    getTeamLeadList
} = require('../controllers/teamLeaderEmployeeController');


//add Employee
router.post('/addEmployee', protect, addEmployee);

router.get('/employeeUnderTl', protect, getAlignedEmployees);

//remove Employee
router.delete('/remove', protect, removeEmployees);

router.get('/teamlead-list', protect,getTeamLeadList)

module.exports = router;



