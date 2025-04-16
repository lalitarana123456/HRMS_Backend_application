const Employee = require('../models/employeeModel');


const getMonthNumber = (monthName) => {
    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    return months[monthName] ?? null;
};


exports.getDesignationWisePerformance = async (req, res) => {
    try {
      const { month } = req.query;//as per the requirement
      const currentDate = new Date();
      let targetMonthNumber, targetYear, targetMonthAbbr;
  
      // only admin and employer roles can access this endpoint
      const userRole = req.user?.role;
      if (!userRole || (userRole !== 'Admin' && userRole !== 'Employer')) {
        return res.status(403).json({ error: 'Access denied. Only admin or employer can create payroll.' });
      }
  
      // Determine the target month and year
      if (month) {
        targetMonthNumber = getMonthNumber(month);
        if (targetMonthNumber === null) {
          return res.status(400).json({ error: "Invalid month format. Use 3-letter format (e.g., Jan, Feb)." });
        }
        targetYear = currentDate.getFullYear();
        // using abbre wala part (e.g., "jan" -> "Jan")
        targetMonthAbbr = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      } else {
        // dafault keeping last month
        currentDate.setMonth(currentDate.getMonth() - 1);
        targetMonthNumber = currentDate.getMonth();
        targetYear = currentDate.getFullYear();
        targetMonthAbbr = currentDate.toLocaleString('default', { month: 'short' });
      }
  
      // Define date range for attendance filtering
      const startDate = new Date(targetYear, targetMonthNumber, 1);
      const endDate = new Date(targetYear, targetMonthNumber + 1, 0);
  
      // Fetch employees that have either attendance or monthlyPerformance data for the target month
      const employees = await Employee.find({
        $or: [
          { "attendance.date": { $gte: startDate, $lte: endDate } },
          { "monthlyPerformance.month": targetMonthAbbr }
        ]
      });
  
      // Predefined designations
      const designations = [
        "UI/UX", "Front-End", "Back-End", "Research", "HR", "Social Media", "IT"
      ];
  
      // initializing aggregation for each designation
      const designationPerformance = {};
      designations.forEach(designation => {
        designationPerformance[designation] = { count: 0, totalPerformance: 0 };
      });
  
      // travelling through each employee and calculating performance for the target month
      employees.forEach(employee => {
        const { designation, monthlyPerformance, attendance } = employee;
        if (!designationPerformance[designation]) return;
  
        let performanceValue;
  
        //targeting monthlyPerformance data if it exists for the target month
        if (monthlyPerformance && monthlyPerformance.length > 0) {
          const performanceRecord = monthlyPerformance.find(record =>
            record.month.toLowerCase() === targetMonthAbbr.toLowerCase()
          );
          if (performanceRecord && performanceRecord.overallPerformancePercentage !== undefined) {
            performanceValue = performanceRecord.overallPerformancePercentage;
          }
        }
  
        // calculate performance from attendance if monthlyPerformance is not available
        if (performanceValue === undefined) {
          if (attendance && attendance.length > 0) {
            const monthlyAttendance = attendance.filter(entry => {
              const entryDate = new Date(entry.date);
              return entryDate >= startDate && entryDate <= endDate;
            });
            const daysAttended = monthlyAttendance.filter(entry => entry.onLeave === "No").length;
            performanceValue = monthlyAttendance.length
              ? (daysAttended / monthlyAttendance.length) * 100
              : 0;
          } else {
            performanceValue = 0;
          }
        }
  
        // accumulating the performance values by designation
        designationPerformance[designation].count += 1;
        designationPerformance[designation].totalPerformance += performanceValue;
      });
  
      // final response with average performance per designation
      const responseMonth = `${targetMonthAbbr} ${targetYear}`;
      const result = Object.entries(designationPerformance).map(([designation, data]) => {
        const avgPerformance = data.count ? (data.totalPerformance / data.count).toFixed(2) : "0.00";
        return { designation, percentage: `${avgPerformance}%`, month: responseMonth };
      });
  
      res.json(result);
    } catch (error) {
      console.error("Error fetching designation-wise performance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
};

exports.getPerformanceData = async (req, res) => {
  try {
      const { employeeId } = req.params; // Extract employee ID from request params
      const loggedInUser = req.user; // Get logged-in user's details from JWT

      // Find the employee by ID in the database
      const employee = await Employee.findById(employeeId);

      // Check if employee exists
      if (!employee) {
          return res.status(404).json({ error: "Employee not found." });
      }

      // Access Control: If the logged-in user is an employer, ensure they can only access employees within their company
      // if (loggedInUser.role === "Employer" && loggedInUser.companyId !== employee.companyId) {
      //     return res.status(403).json({ error: "Unauthorized access. You can only view employees in your company." });
      // }

      // Extract the monthly and yearly performance data
      const monthlyPerformance = employee.monthlyPerformance || [];
      const yearlyPerformance = employee.yearlyPerformance || [];

      // Check if no performance data is available
      if (monthlyPerformance.length === 0 && yearlyPerformance.length === 0) {
          return res.status(404).json({ error: "No performance records found for this employee." });
      }

      // Send the performance data in the response
      res.status(200).json({
          employeeId: employee._id,
          name: employee.fullName,
          designation:employee.designation,
          profilePhoto:employee.profilePhoto,
          monthlyPerformance,
          yearlyPerformance
      });

  } catch (error) {
      console.error("Error fetching performance data:", error);
      res.status(500).json({ error: error.message });
  }
};
  



