// controllers/employeeController.js
const Employee = require('../models/employeeModel');

const getTotalEmployeesPresent = async (req, res) => {
    try {
        const { role ,companyId} = req.user;

        // Ensure only admins or employers can access this
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


        // Get today's start and end time for date comparison
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0); // Start of today

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999); // End of today

        // Get the total number of employees
        const totalEmployees = await Employee.countDocuments(filter);

        // Get the number of employees who have checked in today
        const presentEmployees = await Employee.countDocuments({
            ...filter,
            "attendance.firstCheckIn": { $gte: startOfDay, $lt: endOfDay }
        });

        res.status(200).json({
            date: new Date().toISOString().split('T')[0], // Returns YYYY-MM-DD
            totalEmployees,
            presentEmployees
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};




const getPendingCheckOutCount = async (req, res) => {
    try {
        const { role,companyId } = req.user;

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

        // Calculate start and end of yesterday
        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);

        // Define 8 hours in milliseconds
        const eightHoursInMs = 8 * 60 * 60 * 1000;

        const pendingCheckOutCount = await Employee.aggregate([
            {
                $match: {
                    ...filter, // Apply company-specific filtering
                    "attendance.date": { $gte: yesterdayStart, $lte: yesterdayEnd }, // Attendance for yesterday
                    "attendance.firstCheckIn": { $ne: null }, // Ensures check-in exists
                    "attendance.timerStop": null // Ensures checkout is missing
                }
            },
            {
                $project: {
                    firstCheckIn: { $arrayElemAt: ["$attendance.firstCheckIn", -1] } // Get last check-in
                }
            },
            {
                $match: {
                    $expr: {
                        $gte: [
                            { $subtract: [new Date(), "$firstCheckIn"] }, // Time since check-in
                            eightHoursInMs
                        ]
                    }
                }
            },
            {
                $count: "pendingCheckOutCount"
            }
        ]);

        const count = pendingCheckOutCount.length > 0 ? pendingCheckOutCount[0].pendingCheckOutCount : 0;

        res.status(200).json({ pendingCheckOutCount: count });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};



module.exports = { getTotalEmployeesPresent, getPendingCheckOutCount};