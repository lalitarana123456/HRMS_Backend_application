//importing required modules
const express = require('express');
const router = express.Router();
const { protect, roleAccess } = require('../middleware/authMiddleware');
const payslipController = require('../controllers/payslipController');

//route to get daily payslip
router.get('/all', protect, payslipController.getAllPayslips);

//route to generate payslip
router.post('/generate', protect, payslipController.generatePayslip);

//route to generate payslip PDF 
router.get('/generate-pdf', payslipController.generatePayslipPDF);

//route to download payslip PDF 
router.get('/download-pdf', protect, payslipController.downloadPayslipPDF);




//exporting the router 
module.exports = router;



/*testing purpose
-->generate payslip
POST - http://localhost:8900/payslips/generate

{
        "employeeId":8910,
        "payrollRuns":"12-12-2024",
        "employeeName":"swastik",
        "hoursWorked": 7000,
        "hourlyRate": 90,
        "payType": "Medical Leave",
        "action":"paid"

    
}

{
    "message": "Payslip generated successfully",
    "data": {
        "employeeName": "Jhone",
        "hoursWorked": 40,
        "hourlyRate": 20,
        "grossSalary": 800,
        "deductions": 80,
        "netSalary": 720,
        "_id": "67570e34c440381b6870f5ed",
        "generatedaAt": "2024-12-09T15:35:16.084Z",
        "__v": 0
}

UPDATED ONE-------------------------------------------
    {
    "message": "Payslip generated successfully",
    "data": {
        "employeeName": "Karthi",
        "payrollRuns": "1981/12/11",
        "payType": "Regular",
        "hoursWorked": 50,
        "hourlyRate": 30,
        "deductions": 150,
        "netSalary": 1350,
        "grossSalary": 1500,
        "action": "paid",
        "_id": "675822d59813037193a022f5",
        "generatedaAt": "2024-12-10T11:15:33.822Z",
        "__v": 0
    }
}

-->generate payslip PDF 
GET - http://localhost:8900/payslips/generate-pdf/67570e34c440381b6870f5ed

{
    "message": "Payslip PDF generated",
    "filePath": "payslips/Jhone_payslip.pdf"
}

code: 'ENOENT',
syscall: 'open',
path: 'C:\\Users\\lalit\\HRMS-Backend\\payslips\\Jhone_payslip.pdf'




--->download payslip PDF
GET - http://localhost:8900/payslips/download-pdf


{
    "error": "The \"paths[0]\" argument must be of type string. Received undefined"
}


employeeId 
-----------
1 - 7700
2 - 5003
3 - 8009
4 - 8910

URL/API - GET = http://localhost:8900/payslips/8009

RESPONSE
--------
{
    "success": true,
    "data": [
        {
            "_id": "675ae470b71edf5acba01781",
            "employeeId": "8009",
            "employeeName": "Akaran",
            "payrollRuns": "12-12-2024",
            "payType": "Medical Leave",
            "hoursWorked": 6000,
            "hourlyRate": 50,
            "deductions": 30000,
            "netSalary": 270000,
            "grossSalary": 300000,
            "action": "unpaid",
            "generatedaAt": "2024-12-12T13:26:08.290Z",
            "__v": 0
        }
    ]
}

*/
