//first filter department wise employee 
//2nd if data is for month or year then we can go accordingly
//3rd data -> month then i need to take checkin data of each employee and 
//extract all checkin data monthly basis
//it should represent current month details 
//it will be only get mjethod 
//er - > it will be not authenticated

/*
    DETAILS -->
    targetMonth is :  2024-12
    startDate is :  2024-12-01T00:00:00.000Z
    endDate is :  2024-12-01T00:00:00.000Z
    startDate is :  2024-12-01T00:00:00.000Z
    endDate is :  2024-12-31T00:00:00.000Z
    totalWorkingDays is :  22

     departmentAttendance is :  {
    'Front-End': { total: 22, attended: 2 },
    'Back-End': { total: 44, attended: 4 },
    IT: { total: 22, attended: 1 },
    'UI/UX': { total: 22, attended: 1 }
}
*/

//employee file/ model reference
const Employee = require('../models/employeeModel');

//calculating department- wise attendance percentage
const getDepartmenetWiseAttendance = async (req, res) =>{

    try {
        //role Access Control
        const { role, companyId } = req.user;
        
        if (!role || (role !== "Admin" && role !== "Employer")) {
            return res.status(403).json({ error: "Access denied. Only Admin or Employer can access this data." });
        }

        //1 - Get the target month (default: last month)
        const { month } = req.query;
        const monthMapping = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };

        if (month && !monthMapping.hasOwnProperty(month.toLowerCase())) {
            return res.status(400).json({ error: "Invalid month format. Use three-letter format (e.g., 'Jan', 'Feb')." });
        }

        const targetMonthIndex = month ? monthMapping[month.toLowerCase()] : new Date().getMonth() - 1;
        const targetYear = new Date().getFullYear();

        const startDate = new Date(targetYear, targetMonthIndex, 1);
        const endDate = new Date(targetYear, targetMonthIndex + 1, 0);

        // Format month and year for response
        const monthYear = startDate.toLocaleString("default", { month: "long", year: "numeric" });

        //2 - Calculate total working days (excluding weekends)
        const totalWorkingDays = Array.from({ length: endDate.getDate() }, (_, i) => new Date(startDate.getTime() + i * 86400000))
            .filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;


        //filter part using here
        let filter = { "attendance.date": { $gte: startDate, $lte: endDate } };

        if (role === "Employer") {
            if (!companyId) {
                return res.status(400).json({ error: "Company ID is required for employers." });
            }
            filter.companyId = companyId; // Apply company filtering for Employer
        }    
        //3 - Fetch employees with attendance data for the target month
        const employees = await Employee.find(filter);

        //4 - Group attendance data by designation
        const designationAttendance = {};

        employees.forEach(employee => {
            const { designation, attendance } = employee;

            // **Filter attendance records for the target month**
            const monthlyAttendance = attendance.filter(entry => entry.date >= startDate && entry.date <= endDate);

            // **Count days attended (excluding leaves)**
            const daysAttended = monthlyAttendance.filter(entry => entry.onLeave === "No").length;

            // **Initialize designation data if not present**
            if (!designationAttendance[designation]) {
                designationAttendance[designation] = { total: 0, attended: 0 };
            }

            // **Add data to designation totals**
            designationAttendance[designation].total += totalWorkingDays;
            designationAttendance[designation].attended += daysAttended;
        });

        // **5 - Calculate attendance percentage for each designation**
        const allDesignations = [
            // "Human Resources", "Research Writer", "Finance Analyst", "Lead Generation", "Digital Marketing",
            // "Business Development Executive", "Frontend Developer", "Backend Developer", "Full stack Developer",
            //"UI & UX designer", "Python Developer", 
            "UI/UX", "Front-End", "Back-End", "Research", "HR", "Social Media", "IT", 
            //"Assignment Team Leader", "Digital Team Leader", "Finance Team Leader", "IT Team Leader"
        ];

        const result = allDesignations.map(designation => {
            const data = designationAttendance[designation] || { total: 0, attended: 0 };
            const percentage = data.total > 0 ? ((data.attended / data.total) * 100).toFixed(2) : 0.0;
            return { 
                designation, 
                percentage: parseFloat(percentage),  // Ensuring it's a number
                month: monthYear 
            };
        });

        // **6 - Send response**
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching designation-wise attendance records:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
}


module.exports = {getDepartmenetWiseAttendance}; 