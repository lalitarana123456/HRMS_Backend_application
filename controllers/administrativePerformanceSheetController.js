const mongoose = require('mongoose'); // Import mongoose
const EmployeePerformance = require('../models/employeeModel'); // Import the EmployeePerformance model

// Array to map month numbers to names
const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Get all employee performance data for the previous month and previous year
exports.getAllPerformanceData = async (req, res) => {
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

        // Get the current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Convert to 1-based index (Jan = 1, Dec = 12)
        const currentYear = currentDate.getFullYear(); // Current year
        console.log(currentYear)
        // Calculate previous month and previous year
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear  : currentYear-1;

        console.log(previousMonth);
        console.log(previousYear);

        // Get the previous month's abbreviated name
        const previousMonthAbbrev = monthNames[previousMonth - 1]; // Example: "Dec"

        console.log(previousMonthAbbrev);

        // Query all employees with relevant fields
        const data = await EmployeePerformance.find((filter),
            'fullName employeeId _id designation department monthlyPerformance yearlyPerformance profilePhoto');

        if (!data.length) {
            return res.status(404).json({ message: "No employee performance data found." });
        }

        // Format the data as requested
        const formattedData = data.map(item => {
            // Find the previous month's performance
            const previousMonthPerformance = item.monthlyPerformance.find(m => m.month === previousMonthAbbrev && m.year === currentYear);
            console.log(previousMonthPerformance);         
            // Find the previous year's star rating
            const previousYearStarRating = item.yearlyPerformance.find(y => y.year === previousYear);
            console.log(previousYearStarRating);
            return {
                fullName: item.fullName,
                employeeId: item.employeeId,
                ObjectId:item._id,
                designation: item.designation || "Not provided",
                department: item.department,
                profilePhoto: item.profilePhoto,
                monthlyPerformance: {
                    month: previousMonthAbbrev, 
                    year:currentYear,
                    overallPerformancePercentage: previousMonthPerformance ? previousMonthPerformance.overallPerformancePercentage : 0.0
                },
                yearlyPerformance: {
                    year:previousYear,
                    overallStarRating: previousYearStarRating ? previousYearStarRating.overallStarRating : 0.0
                }
            };
        });

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("Error retrieving performance data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get performance data by Employee ID
exports.getPerformanceByEmployeeId = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate Employee ID format
        if (!id || id.trim() === "") {
            return res.status(400).json({ error: "Invalid Employee ID provided." });
        }

        let query = mongoose.Types.ObjectId.isValid(id) 
            ? { _id: id }  // If it's a valid ObjectId, search by _id
            : { employeeId: id }; // Otherwise, search by employeeID

        const data = await EmployeePerformance.findOne(query, 
            'fullName employeeId designation department monthlyPerformance.overallPerformancePercentage yearlyPerformance.overallStarRating');

        if (!data) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error retrieving employee performance:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
