//importing exceljs library
const ExcelJs = require('exceljs');



//function to export leave data to excel
exports.exportToExcel = async (leaveRequests) =>{

    //creating a new workbook and worksheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet('Leave Data');


    //defining columns 
    worksheet.columns = [
        {header: 'Employee Id', key: 'employeeId', width:15},
        {header: 'Employee Name', key: 'employeeName', width:20},
        {header: 'Leave Type', key: 'leaveType', width:15},
        {header: 'Start Date', key: 'startDate', width:15},
        {header: 'End Date', key: 'endDate', width:15},
        {header: 'Status', key: 'status', width:10},
        {header: 'Leave Balance', key: 'leaveBalance', width:15},
    ];


    //add rows
    leaveRequests.forEach((request) => {
        worksheet.addRow(request);     
    });

    //exporting as buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;

};
