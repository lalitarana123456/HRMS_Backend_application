const Employee = require('../models/employeeModel');
 
//const Employee = require('../models/employeeModel');

// Controller to count leave types for "Pending" status
exports.countPendingLeaveTypes = async (req, res) => {
    try {

        const { role, companyId } = req.user;

        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

         //filter as per the loggedin user 
        let filter = {};
        if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        } else if(role === 'Admin') {
            filter.companyId = null;
        }
        // Fetch all employees from the database
        const employees = await Employee.find(filter);

        // Initialize leave counters for each specific type
        const leaveCount = {
            'Maternity Leave': 0,
            'Sick Leave': 0,
            'Emergency Leave': 0,
            'Personal Leave': 0,
            'Menstrual Leave': 0,
            'Bereavement Leave': 0
        };

        // Loop through each employee and their leaves
        employees.forEach(employee => {
            if (Array.isArray(employee.leaves)) { // Check if 'leaves' exists and is an array
                employee.leaves.forEach(leave => {
                    // Check if the leave is pending and matches specified leave types
                    if (leave.status === 'Pending' && leaveCount.hasOwnProperty(leave.leaveType)) {
                        // Increment the respective leave type count
                        leaveCount[leave.leaveType] += 1;
                    }
                });
            }
        });

        // Return the leave count as the response
        res.status(200).json(leaveCount);
    } catch (error) {
        console.error("Error counting leave types:", error);
        res.status(500).json({ message: error.message });
    }
};