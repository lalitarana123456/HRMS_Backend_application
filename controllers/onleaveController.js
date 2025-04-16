const Employee = require('../models/employeeModel');
//const moment = require('moment');
const moment = require('moment'); // Import moment for date handling

exports.getApprovedLeaves = async (req, res) => {
    try {

        const { role, companyId } = req.user;
        const today = new Date(); // get today's date as a Date object


        let filter = {
            'leaves.status': 'Approved',
            'leaves.startDate': { $lte: today }, // Leave should have started on or before today
            'leaves.endDate': { $gte: today }   // Leave should end on or after today
        };

        if (role === "Employer") {
            if (!companyId) {
                return res.status(400).json({ message: "Company ID is required for employers." });
            }
            filter.companyId = companyId; // Apply company filtering for Employer
        }
        // Fetch employees with at least one approved leave for today
        const employees = await Employee.find(filter);

       
        const approvedLeavesData = employees.map(employee => {
            // Find the first approved leave for today
            const approvedLeave = employee.leaves.find(leave => 
                leave.status === 'Approved' &&
                new Date(leave.startDate) <= today &&
                new Date(leave.endDate) >= today
            );

            console.log("approvedLeave", approvedLeave);

            return {
                id: employee._id, // employee ObjectId
                fullName: employee.fullName,
                department: employee.department,
                profilePhoto: employee.profilePhoto, // added profile photo
                leaveObjectId: approvedLeave ? approvedLeave._id : null, // single leave ObjectId
                leaveType: approvedLeave ? approvedLeave.leaveType : null // single leave type
            };
        });

        res.status(200).json(approvedLeavesData);
    } catch (error) {
        console.error("Error fetching approved leaves:", error);
        res.status(500).json({ message: error.message });
    }
};

