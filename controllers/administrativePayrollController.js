//taking emplotyee reference
const Employee = require('../models/employeeModel');
const upload = require('../middleware/multerMiddleware');
const mongoose = require('mongoose');  // Import mongoose to use its ObjectId validation method
const path = require('path');
const PDFDocument = require('pdfkit') //pdf generation library
const fs = require('fs');   //file system module
const moment = require('moment');


exports.createPayroll = [upload.array('documents', 5), async (req, res) => {
    try {
        const { payType, status, payrollRuns, description } = req.body;
        const { employeeId } = req.params;

        // validating employeeId format
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format. It must be a 24-character hex string.' });
        }

        // validating required fields
        if (!payType || !status || !payrollRuns || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // identifying roles
        const userRole = req.user?.role;
        if (!userRole || (userRole !== 'Admin' && userRole !== 'Employer')) {
            return res.status(403).json({ error: 'Access denied. Only admin or employer can create payroll.' });
        }

        //with the help of onjectId extracting employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // calculating salary details
        const oneDaySalary = employee.salary / 30;
        let deduction = 0;
        let netSalary = 0;

        // basic deduction logic based on leave status
        if (status === 'Paid' || status === 'Holiday') {
            deduction = 0;  
            netSalary = employee.salary;  
        } else if (status === 'Half Paid') {
            deduction = oneDaySalary / 2;  
            netSalary = employee.salary - deduction;
        } else if (status === 'Unpaid') {
            deduction = oneDaySalary;  
            netSalary = employee.salary - deduction;
        }

        //updating leave employee total deductions
        employee.salaryDeduction = (employee.salaryDeduction || 0) + deduction;

        //document uploading
        let documentPaths = [];
        if (req.files && req.files.length > 0) {
            documentPaths = req.files.map(file => file.path);
        }

        // now creating the payroll record
        const payroll = {
            payType,
            status,
            payrollRuns,
            description,
            oneDayPay: oneDaySalary,
            grossSalary: employee.salary, 
            deductions: deduction,
            netSalary: netSalary,
            documents: documentPaths //here we r saving multiple files
        };

        //now saving payroll data
        employee.payrollHistory.push(payroll);
        await employee.save();

        res.status(201).json({ message: 'Payroll created successfully', payroll });
    } catch (error) {
        console.error('Error creating payroll', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}];



exports.getAllPayrollHistory = async (req, res) => {
    try {
        // Checking user role
        const { role, companyId } = req.user;

        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }


        let filter = {};
        if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        } else if(role === 'Admin') {
            filter.companyId = null;
        }

        // Fetching all employees with payroll history
        const employees = await Employee.find(filter)
            .select('fullName employeeId department profilePhoto payrollHistory attendance');

        if (!employees.length) {
            return res.status(404).json({ message: 'No employees found.' });
        }

        // Formatting response
        const formattedResponse = employees.map(emp => {
            // Get current date in YYYY-MM-DD format
            const currentDate = moment().format('YYYY-MM-DD');

            // Filter attendance records for the current day
            const todayAttendance = emp.attendance?.filter(att => 
                moment(att.date).format('YYYY-MM-DD') === currentDate
            ) || [];

            // Calculate total time spent today in seconds
            const totalTimeSpentToday = todayAttendance.reduce((acc, att) => acc + att.timeSpent, 0);
            const durationInHours = (totalTimeSpentToday / 3600).toFixed(2); // Convert seconds to hours

            // Determine duration status based on today's duration
            let durationStatus;
            if (durationInHours > 0 && durationInHours <= 4) {
                durationStatus = 'Half Day';
            } else if(durationInHours == 0 ){
                durationStatus = 'Leave';
            }

            // Getting payroll history status
            const payrollStatus = emp.payrollHistory.map(payroll => payroll.status);

            return {
                fullName: emp.fullName,
                employeeId: emp.employeeId,
                department: emp.department,
                profilePhoto: emp.profilePhoto,
                durationToday: `${durationInHours} hours`, // Today's duration
                durationStatus: durationStatus, // Status based on duration
                payrollStatus: payrollStatus,
                emp,
            };
        });

        res.status(200).json(formattedResponse);

    } catch (error) {
        console.error('Error fetching payroll history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


// Function to generate and download an employee's payslip PDF
exports.downloadEmployeePayslipPDF = async (req, res) => {
    try {
        // Extract employee ID from request parameters
        const { employeeId } = req.params;
        // Extract logged-in user details from request (assuming authentication middleware is used)
        const loggedInUser = req.user;

        // Check if the logged-in user is an Admin or Employer; otherwise, deny access
        if (loggedInUser.role !== 'Admin' && loggedInUser.role !== 'Employer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch employee details from the database using the provided employee ID
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Retrieve payroll history of the employee (if exists)
        const payrollData = employee.payrollHistory || [];
        if (payrollData.length === 0) {
            return res.status(404).json({ error: 'No payroll data found' });
        }

        // Get the latest payroll record from the history
        const latestPayroll = payrollData[payrollData.length - 1];

        // Define the directory where the PDF will be saved
        const directoryPath = path.join(__dirname, '../uploads/payslips');
        // Check if the directory exists; if not, create it
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Define the file path for the payslip PDF
        const filePath = path.join(directoryPath, `${employeeId}_payslip.pdf`);
        // Create a new PDF document with A4 size and margins
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        // Create a writable stream for saving the PDF
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Define page dimensions and margins
        const pageWidth = doc.page.width;
        const margin = 2; // Left margin
        const tableWidth = pageWidth- (margin * 2); // Full table width

        // --- 1. Header Section with Light Pink Background ---
        doc.rect(0, 0, doc.page.width, 120).fill('#E6E6FA'); // Light pink header background

        // Add Company Logo (if exists)
        const logoPath = path.join(__dirname, '../uploads/logoImage/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { width: 80 });
        }

        // Add Contact Details (right-aligned)
        doc.fillColor('black').fontSize(10).text('+4917621944826', 400, 50, { align: 'right' });
        doc.text('+917830295175', { align: 'right' });
        doc.text('contact@theassigner.com', { align: 'right' });
        doc.text('info@theassigner.com', { align: 'right' });
        doc.text('www.theassigner.com', { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(14) // Reduce font size if needed
            .font('Helvetica-Bold')
            .text(`Pay Slip for the Month of ${moment().format('MMMM, YYYY')}`, 0, doc.y, { 
                align: 'center', // Ensures proper centering
                width: doc.page.width // Uses full page width to prevent line breaks
            });
        // --- Employee Details (Left Aligned) ---
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica')
            .text(`Employee Name: ${employee.fullName}`, margin, doc.y)
            .text(`Designation: ${employee.designation}`, margin, doc.y + 15)
            .text(`Starting Date: ${moment(employee.joiningDate).format('MMMM D, YYYY')}`, margin, doc.y + 30)
            .moveDown(1);

        // --- 4. Attendance Details (Centered) ---
        doc.fontSize(12).font('Helvetica-Bold')
            .text('Attendance Details:', { align: 'center' })
            .moveDown(0.5);

        // --- 5. Attendance Table (Full Width) ---
        const tableTop = doc.y; // Store the Y position for table start
        const columnWidths = [tableWidth / 2, tableWidth / 2]; // Two equal columns

        // First Row (Headers)
        doc.rect(margin, tableTop, columnWidths[0], 20).stroke();
        doc.text('Total Working Days', margin + 10, tableTop + 5);

        doc.rect(margin + columnWidths[0], tableTop, columnWidths[1], 20).stroke();
        doc.text('Leaves', margin + columnWidths[0] + 10, tableTop + 5);

        // Second Row (Attendance data)
        const rowTop = tableTop + 20;
        doc.rect(margin, rowTop, columnWidths[0], 20).stroke();
        doc.text('Half Day', margin + 10, rowTop + 5);

        doc.rect(margin + columnWidths[0], rowTop, columnWidths[1], 20).stroke();
        doc.text('Holiday', margin + columnWidths[0] + 10, rowTop + 5);

        // --- 6. Earnings & Deductions Table ---
        const earningsTableY = rowTop + 40; // Position for earnings table
        const colWidth = tableWidth / 2; // Two equal columns
        const rowHeight = 20; // Row height

        // Table Headers
        doc.rect(margin, earningsTableY, tableWidth, rowHeight).stroke();
        doc.text('Earnings', margin + 10, earningsTableY + 5);
        doc.text('Deductions', margin + colWidth + 10, earningsTableY + 5);

        // Table Data (Earnings and Deductions)
        const earningsData = [
            ['Basic Pay', 'Leave Deduction'],
            ['Sim Charges', 'Half Day Deduction'],
            ['Bonus', ''],
            ['Total Earnings', 'Total Deduction'],
            ['Net Pay', '']
        ];

        let currentY = earningsTableY + rowHeight;
        earningsData.forEach(row => {
            doc.rect(margin, currentY, colWidth, rowHeight).stroke();
            doc.text(row[0], margin + 10, currentY + 5);
            doc.rect(margin + colWidth, currentY, colWidth, rowHeight).stroke();
            doc.text(row[1], margin + colWidth + 10, currentY + 5);
            currentY += rowHeight;
        });

        // --- 7. Payment Date ---
        doc.fontSize(10).font('Helvetica-Bold')
            .text(`Payment Date: ${moment().format('MMMM D, YYYY')}`, margin, currentY + 20)
            .moveDown(2);

        // --- 8. Signature (Bottom-Right) ---
        const signaturePath = path.join(__dirname, '../uploads/logoImage/signature.png');
        if (fs.existsSync(signaturePath)) {
            const signatureY = doc.page.height - 70;
            const signatureX = pageWidth - 150;
            doc.image(signaturePath, signatureX, signatureY - 40, { width: 100 });
            doc.moveDown(1); // Adds vertical spacing
            doc.text('(Authorized Signature)', signatureX, signatureY, { align: 'center' });
        }

        // Finalize and save the document
        doc.end();

        // Once the PDF is saved, send it as a response for download
        stream.on('finish', () => {
            res.download(filePath, `${employeeId}_payslip.pdf`, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Failed to download payslip' });
                }
            });
        });

    } catch (error) {
        // Handle any unexpected errors
        console.error('Error generating payslip:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




