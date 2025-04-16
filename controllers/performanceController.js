const Employee = require('../models/employeeModel');
const mongoose = require('mongoose');

exports.createMonthlyPerformance = async (req, res) => {
    try {
        // Ensure only Team Leader or Admin can access this endpoint
        const teamLeaderRoles = [
            'IT Team Leader',
            'Assignment Team Leader',
            'Digital Team Leader',
            'Finance Team Leader'
        ];
    
        if (!teamLeaderRoles.includes(req.user.designation)) {
            return res.status(403).json({
                message: 'Access forbidden: only Team Leaders can give monthly performance.',
            });
        }

        const { employeeId } = req.params;
        const { overallPerformancePercentage, commentCategory, commentText, month } = req.body;

        // Convert full month name to 3-letter abbreviation
        const monthAbbreviations = {
            'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr', 'May': 'May',
            'June': 'Jun', 'July': 'Jul', 'August': 'Aug', 'September': 'Sep', 'October': 'Oct',
            'November': 'Nov', 'December': 'Dec'
        };

        const abbreviatedMonth = monthAbbreviations[month] || month;
        // validating that the month and year are the current month and year
        const currentDate = new Date();
        // const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
        if ( abbreviatedMonth !== currentMonth) {
            return res.status(400).json({ error: 'Monthly performance can only be created for the current month and year.' });
        }

        // Find employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Check if performance for the same month and year already exists
        const existingPerformance = employee.monthlyPerformance.find(perf => 
            perf.month === abbreviatedMonth && perf.year === year
        );

        if (existingPerformance) {
            return res.status(400).json({ error: `Performance for ${month} ${year} already exists.` });
        }

        // Create and save the monthly performance
        const monthlyPerformance = {
            overallPerformancePercentage,
            commentCategory,
            commentText,
            month: abbreviatedMonth
        
        };

        employee.monthlyPerformance.push(monthlyPerformance);
        // Inside the try block after saving the performance
        employee.notifications.push({
            title:'Monthly performance',
            message: `Monthly performance for ${currentMonth} has been added.`,
        });
        await employee.save();

        res.status(201).json({ message: 'Monthly performance created successfully.', performance: monthlyPerformance });
    } catch (error) {
        console.error('Error creating monthly performance:', error);
        res.status(400).json({ error: error.message });
    }
};

 
exports.getMonthlyPerformances = async (req, res) => {
    try {
 
    const monthlyPerformance = req.user.monthlyPerformance;
    //console.log(monthlyPerformance);
    if (!monthlyPerformance || monthlyPerformance.length === 0) {
      return res.status(404).json({ error: 'No monthly performance records found.' });
    }
 
    res.status(200).json(monthlyPerformance);
    } catch (error) {
        console.error('Error fetching monthly performances:', error);
        res.status(500).json({ error: error.message });
    }
};
 
// ----------
 
exports.createYearlyPerformance = async (req, res) => {
    try {
        // ensuring only Team Leader or Admin can access this endpoint
        const teamLeaderRoles = [
            'IT Team Leader',
            'Assignment Team Leader',
            'Digital Team Leader',
            'Finance Team Leader'
        ];
    
        // checking if the user is a team leader
        if (!teamLeaderRoles.includes(req.user.designation)) {
            return res.status(403).json({
            message: 'Access forbidden: only Team Leaders can give monthly performance.',
            });
        }
        // extracting employeeId from request parameters
        const { employeeId } = req.params;
 
        // finding the employee to associate with the performance
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        let yealyPerformancePercentage = employee.yearlyOverallPerformancePercentage;


        // getting the current year from the employee schema
        const currentYear = employee.year; // as it's already set to the current year, so we r using here

        // checking if performance for the same year already exists
        const existingPerformance = await Employee.findOne({
            _id: employeeId,
            'yearlyPerformance.year': currentYear,
        });

        if (existingPerformance) {
            return res.status(400).json({ error: 'Performance for this year already exists.' });
        }
 
        // extracting performance details from request body
        const {
            // overallPerformancePercentage,
            commentCategory,
            commentText,
            taskCompletion,
            attendanceRating,
            efficiencyScore,
            teamCollaborationRating,
            
        } = req.body;

        // calculating overall star rating based on the four ratings
        const ratings = [taskCompletion, attendanceRating, efficiencyScore, teamCollaborationRating];
        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
 
        // round to nearest half or full star (0.5, 1.0, ..., 5.0)
        const overallStarRating = Math.round(averageRating * 2) / 2;
 
        // Create and save the yearly performance
        const yearlyPerformance = {
            overallPerformancePercentage: yealyPerformancePercentage,
            commentCategory,
            commentText,
            taskCompletion,
            attendanceRating,
            efficiencyScore,
            teamCollaborationRating,
            overallStarRating, // add overall star rating
            year: currentYear
        };
 
        employee.yearlyPerformance.push(yearlyPerformance);
           // Inside the try block after saving the performance
           employee.notifications.push({
            title:'Yearly performance',
            message: `Yearly performance for ${currentYear} has been added.`,
        });
        await employee.save();
 
        res.status(201).json({ message: 'Yearly performance created successfully.', performance: yearlyPerformance });
    } catch (error) {
        console.error('Error creating yearly performance:', error);
        res.status(400).json({ error: error.message });
    }
};
 
exports.getYearlyPerformances = async (req, res) => {
    try {
        const yearlyPerformance = req.user.yearlyPerformance;
        if (!yearlyPerformance || yearlyPerformance.length === 0) {
            return res.status(404).json({ error: 'No yearly performance records found.' });
        }
 
        res.status(200).json(yearlyPerformance);
    } catch (error) {
        console.error('Error fetching yearly performances:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        res.status(200).json({ notifications: employee.notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
};
