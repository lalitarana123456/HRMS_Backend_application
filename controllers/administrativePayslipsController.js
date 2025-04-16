const Employee = require('../models/employeeModel'); // Import Employee model

// Function to fetch employee details
const getEmployeeDetails = async (req, res) => {
    try {
        const employees = await Employee.find({}, 'employeeId firstName lastName designation employeeStatus  payslipHistory');

        const formattedEmployees = employees.map(emp => ({
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            designation: emp.designation,
            employeeStatus: emp.employeeStatus,
            payslipHistory: emp.payslipHistory.map(payslip => ({
                month: payslip.month,
                year: payslip.year,
                downloadUrl: payslip.fileUrl  // Downloadable file URL
            }))
        }));

        res.status(200).json(formattedEmployees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee data', error: error.message });
    }
};

module.exports = { getEmployeeDetails };