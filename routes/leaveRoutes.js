//importing required modules
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect, roleAccess } = require('../middleware/authMiddleware');



//Route to create a leave request
router.post('/create', protect, leaveController.createLeaveRequest);

//Router to get all leave request 
router.get('/all', protect, leaveController.getEmployeeLeaves);

//Router to cancel leave request by employee if status is still pending
router.delete('/cancel', protect, leaveController.cancelLeaveRequest);

//Router to modify leaveRequest
router.put('/modify', protect, leaveController.modifyLeaveRequest);

//Router to update leave status(approve/deny)
router.put('/status/:id', protect, leaveController.approveOrDenyLeaveRequest);

//Router to gget the leave balance
router.get('/leaveBalance', protect, leaveController.getLeaveBalance);

router.get('/salaryOrDeduction', protect, leaveController.getSalaryAndDeductionOfEmployee)

//route to get leave details of a particular of rejection
router.get('/leaveDetails/:leaveId', protect, leaveController.getLeaveRequestDetails);

//Router tp export leave data to Excel
router.get('/export', leaveController.exportLeaveData);


//exporting the router
module.exports = router;






/*
    AREA FOR TESTING PURPOSE


    create a leave request
    POST -- http://localhost:8900/leaves/request

    REQUEST
    {
    "employeeId":"123",
    "employeeName":"Hinata",
    "leaveType":"Sick",
    "startDate":"2024-12-10",
    "endDate":"2024-12-12"
    }

    RESPONSE
    {
    "message": "Leave request created successfully",
    "data": {
        "employeeId": "123",
        "employeeName": "Hinata",
        "leaveType": "Sick",
        "startDate": "2024-12-10T00:00:00.000Z",
        "endDate": "2024-12-12T00:00:00.000Z",
        "status": "Pending",
        "leaveBalance": 10,
        "_id": "6759cef5a46931c6d4b2bf4a",
        "leaveHistory": [],
        "createdAt": "2024-12-11T17:42:13.161Z",
        "__v": 0
    }
}

    update leave status(approve/deny)
    PATCH -- http://localhost:8900/leaves/status/6759c3693ec9462a3d2fa4eb

    REQUEST
    {
      "status":"Approved"
    }

    RESPONSE
{
    "message": "Leave status updated",
    "data": {
        "_id": "6759c3693ec9462a3d2fa4eb",
        "employeeId": "123",
        "employeeName": "Hinata",
        "leaveType": "Sick",
        "startDate": "2024-12-10T00:00:00.000Z",
        "endDate": "2024-12-12T00:00:00.000Z",
        "status": "Approved",
        "leaveBalance": 8,
        "leaveHistory": [
            {
                "leaveType": "Sick",
                "startDate": "2024-12-10T00:00:00.000Z",
                "endDate": "2024-12-12T00:00:00.000Z",
                "status": "Approved",
                "_id": "6759ce53a46931c6d4b2bf46"
            }
        ],
        "createdAt": "2024-12-11T16:52:57.026Z",
        "__v": 1
    }
}

get all leave request
GET -- http://localhost:8900/leaves/all
RESPONSE - GETTING ALL LEAVES REQUEST IN DATABASE


export leave data to Excel
GET -- http://localhost:8900/leaves/export
RESPONSE - IN XML FORM

*/
