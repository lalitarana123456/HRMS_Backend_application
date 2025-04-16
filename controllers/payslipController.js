//importing requied modules
// const Payslip = require('../models/payslipModel');  //payslip model
const Employee = require('../models/employeeModel');
const calculatePayslip = require('../utils/calculatePayslip');
const path = require('path');
const moment = require('moment');

const PDFDocument = require('pdfkit') //pdf generation library
const fs = require('fs');   //file system module


//Getting daily payslip for the login employee
exports.getAllPayslips = async (req, res) =>{

    try{
        //console.log(req);
        //finding the logged-in emplopyee using Id from the protect middleware
        const employee = await Employee.findById(req.user.id);
        //console.log(employee);

        //check if the employee exists
        if(!employee){
            return res.status(404).json({error: 'Employee not found.'});
        } 

        //formatting date 
        const formattedHistory = employee.payrollHistory.map((entry) => ({
            ...entry._doc,
            payrollRuns: moment(entry.payrollRuns).format("MMM DD YYYY"), // Format the date
        }));

        //fetching the emplopyee payroll history
        //const payslipHistory = employee.payrollHistory;

        //responding with the payslip history
        res.status(200).json({message: 'Payslip history fetched successfully.',  data: formattedHistory});

    }catch(error){
        console.log('Error fetching payslip:', error.message);
        res.status(500).json({error: 'Server error while fetching payslip data'});
    }
}

//now payroll is creating from adminisotrative sioide
exports.generatePayslip = async (req, res) => {
    try {
        // Ensure the user is an Admin or Employer
        if (req.user.role !== 'Admin' && req.user.role !== 'Employer') {
            return res.status(403).json({ message: 'Access forbidden: Only Admin or Employer can generate payroll.' });
        }

        // Extract employeeId from query parameters
        const { employeeId } = req.query;

        // Find the employee by employeeId (not _id)
        const employee = await Employee.findOne({ employeeId }); // Use employeeId, not findById
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Extract payslip data from the request body
        const {
            payrollRuns,
            payType,
            hoursWorked,
            hourlyRate,
            deductions,
            grossSalary,
            netSalary,
            status,
        } = req.body;

        // Validate required fields
        // if (!payType || !hoursWorked || !hourlyRate || !deductions || !grossSalary || !netSalary) {
        //     return res.status(400).json({ error: 'All fields are required.' });
        // }

        // Validate and parse payrollRuns date (DD-MM-YYYY)
        const parsedDate = moment(payrollRuns, 'DD-MM-YYYY', true);
        if (!parsedDate.isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use DD-MM-YYYY.' });
        }

        // Create a new payslip object
        const newPayslip = {
            payrollRuns: parsedDate.toDate(),
            payType,
            hoursWorked: parseFloat(hoursWorked),
            hourlyRate: parseFloat(hourlyRate),
            deductions: parseFloat(deductions),
            grossSalary: parseFloat(grossSalary),
            netSalary: parseFloat(netSalary),
            status, 
        };

        // Add the new payslip to the employee payroll history
        employee.payrollHistory.push(newPayslip);

        // Save the updated employee record
        await employee.save();

        return res.status(201).json({ message: 'Payslip generated successfully.', data: newPayslip });
    } catch (error) {
        console.error('Error generating payslip:', error.message);
        res.status(500).json({ error: 'Server error while generating payslip.' });
    }
};

//I need to modify it as now we r taking payslip inside employee
//API to generate payslip as a PDF//no need now, as of now
exports.generatePayslipPDF = async (req, res) =>{

    try{
        //getting payslip ID from the requiest params
        const {id} = req.params;
        //console.log(id);

        //finding the payslip in the database
        const payslip = await Payslip.findById(id);

        if(!payslip){

            return res.status(404).json({error: error.message});
        }


        //creating a PDF document 
        const doc = new PDFDocument();
        
        //file path for the PDF
        const filePath = `payslips/${payslip.employeeName}_payslip.pdf`;

        //pipe the PDF to the weitable stream
        doc.pipe(fs.createWriteStream(filePath));

        //adding payslip data to the PDF
        doc.fontSize(20).text('Payslip', {align: 'center'});//need to update
        doc.text(`Employee Name: ${payslip.employeeName}`);
        doc.text(`Payroll Runs: ${payslip.payrollRuns}`);
        doc.text(`Pay Type: ${payslip.payType}`);
        doc.text(`Action: ${payslip.action}`);
        doc.text(`Hours worked: ${payslip.hoursWorked}`);
        doc.text(`Hourly Rate: ${payslip.hourlyRate}`);
        doc.text(`Gross Salary: ${payslip.grossSalary}`);
        doc.text(`Deductions: ${payslip.deductions}`);
        doc.text(`Net Salary: ${payslip.netSalary}`);
        doc.text(`Generated At: ${payslip.generatedaAt}`);


        //finalizing the PDF and write it 
        doc.end();

        //responding with the success message and file path
        res.status(200).json({message: 'Payslip PDF generated', filePath});

    }catch(error){
        //respoonding error message
        res.status(500).json({error: error.message});
    }

};


exports.downloadPayslipPDF = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const payrollData = employee.payrollHistory || [];
        if (payrollData.length === 0) {
            return res.status(404).json({ error: 'No payroll data found' });
        }

        // Ensure directory exists
        const directoryPath = path.join(__dirname, '../uploads/payslips');
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        const filePath = path.join(directoryPath, `${employeeId}_payslip.pdf`);
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Path to logo image
        const logoPath = path.join(__dirname, '../uploads/logoImage/logo-logo.png');

        // Add logo as a watermark (if the file exists)
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 100, 160, {
                width: 300,
                opacity: 0.1, // Set opacity for watermark effect
                align: 'center'
            });
        }

        const assignerTextPath = path.join(__dirname, '../uploads/logoImage/THE ASSIGNER.png');

        // Add assigner text image (if the file exists)
        if (fs.existsSync(assignerTextPath)) {
            doc.image(assignerTextPath, 200, 350, { // Adjust x, y position
                width: 250, // Adjust size if needed
                opacity: 0.2, // Set opacity for watermark effect
                align: 'center'
        });
}

        // Header Title
        doc.fontSize(22).fillColor('black').font('Helvetica-Bold').text('Receipt', { align: 'center' }).moveDown(1);

        // Employee Details
        let startY = 120;
        doc.fontSize(14).font('Helvetica').text(`Employee Name: `, 50, startY, { continued: true }).font('Helvetica-Bold').text(employee.fullName);
        doc.text(`Emp ID: `, { continued: true }).font('Helvetica-Bold').text(employee.employeeId).moveDown(1);
        doc.text(`Job Title: `, { continued: true }).font('Helvetica-Bold').text(employee.designation).moveDown(1);

        // Salary Details
        doc.font('Helvetica-Bold').fontSize(16).text(`Salary Details`, { underline: true }).moveDown(0.5);
        doc.font('Helvetica').fontSize(14).text(`Basic Salary: `, { continued: true }).font('Helvetica-Bold').text(`Rs ${employee.salary.toLocaleString()}`);
        doc.font('Helvetica').text(`Deductions: `, { continued: true }).font('Helvetica-Bold').fillColor('red').text(`-Rs ${employee.salaryDeduction.toLocaleString()}`);
        doc.font('Helvetica').fillColor('black').text(`Total Salary: `, { continued: true }).font('Helvetica-Bold').text(`Rs ${(employee.salary - employee.salaryDeduction).toLocaleString()}`);
        doc.text(`Payment Date: `, { continued: true }).font('Helvetica-Bold').text(new Date().toDateString()).moveDown(1);

        // Company Details
        doc.font('Helvetica-Bold').fontSize(16).text(`Company Details`, { underline: true }).moveDown(0.5);
        doc.font('Helvetica').fontSize(14).text(`The Assigner`);

        // End PDF
        doc.end();

        // Send file after writing is complete
        stream.on('finish', () => {
            res.download(filePath, `${employeeId}_payslip.pdf`, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Failed to download payslip' });
                }
            });
        });

        stream.on('error', (err) => {
            console.error('Error writing file:', err);
            res.status(500).json({ error: 'Failed to generate payslip' });
        });

    } catch (error) {
        console.error('Error generating payslip:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
