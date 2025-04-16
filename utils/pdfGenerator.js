const PDFdocument = require('pdfkit');
const fs = require('fs');



//API which will generate pdf
const generatePayslipPDF = (payslipData, outputFilterPath) =>{

    const doc = new PDFdocument();
    doc.pipe(fs.createWriteStream(outputFilterPath));


    //adding payslip content 
    doc.fontSize(16).text('Payslip', {align: 'center'});
    doc.moveDown();


    doc.fontSize(12)
    .text(`Employee ID: ${payslipData.employeeId}`)
    .text(`Pay Type: ${payslipData.payType}`)
    .text(`Payroll Runs: ${payslipData.payrollRuns}`)
    .text(`Deductions: ${payslipData.deductions}`)
    .text(`Net Salary: ${payslipData.netSalary}`)
    .text(`Gross Salary: ${payslipData.grossSalary}`)
    .text(`Action: ${payslipData.action}`)
    .text(`Generated At: ${payslipData.generatedAt}`);

    doc.end();
   

};


module.exports = { generatePayslipPDF };
