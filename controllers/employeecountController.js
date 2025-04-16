const Employee = require('../models/employeeModel');
// here we counting total employee present in db 
const getTotalEmployees = async (req, res) => {
    try {
        const { role, companyId } = req.user;
        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }
        let filter = {};
        if (role === 'Admin') {
            filter.companyId = null;
        } else if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        }
        const totalEmployees = await Employee.countDocuments(filter);
        res.status(200).json({ totalEmployees });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
// here we counting total full time employees 
const getFullTimeEmployeeCount = async (req, res) => {
    try {
        const { role, companyId } = req.user; // getting details of logged-in user
        //  admin and Employer can access this API only
        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }
        let filter = { employeeStatus: 'Full Time' }; // filtering for only full-time employees
        if (role === 'Admin') {
            // admin can see only employees where companyId is NULL
            filter.companyId = null;
        } else if (role === 'Employer') {
            // employer should see only employees from their own company
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        }
        // count only full-time employees with the appropriate filter
        const fullTimeEmployees = await Employee.countDocuments(filter);
        res.status(200).json({ fullTimeEmployees });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

    // here we are counting the employees on leaves 
const getLeaveEmployeeCount = async (req, res) => {
    try {
        const { role, companyId } = req.user;
        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }
        let filter = {};
        if (role === 'Admin') {
            filter.companyId = null;
        } else if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        }
        const currentDate = new Date().toISOString().split('T')[0];
        filter.leaves = {
            $elemMatch: {
                startDate: { $lte: new Date(currentDate) },
                endDate: { $gte: new Date(currentDate) },
                status: 'Approved'
            }
        };
        const leaveCount = await Employee.countDocuments(filter);
        res.status(200).json({ leaveCount });
    } catch (error) {
        console.error('Error fetching leave count:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
    // here we are counting the employee those who are on intern 
const getInternEmployeeCount = async (req, res) => {
    try {
        const { role, companyId } = req.user;
        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }
        let filter = { employeeStatus: 'Intern' };
        if (role === 'Admin') {
            filter.companyId = null;
        } else if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        }
        const internEmployees = await Employee.countDocuments(filter);
        res.status(200).json({ internEmployees });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
    
module.exports = { getTotalEmployees ,  getFullTimeEmployeeCount ,getLeaveEmployeeCount ,getInternEmployeeCount};

