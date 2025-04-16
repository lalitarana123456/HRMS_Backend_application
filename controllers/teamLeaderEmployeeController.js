const Employee = require('../models/employeeModel');
const mongoose = require('mongoose');



//adding employee
exports.addEmployee = async (req, res) => {
  try {

    //exact the 
    const { email, fullName, employeeId, contactNumber, teamLeaderId } = req.body;

     // identifying roles
     const userRole = req.user?.role;
     if (!userRole || (userRole !== 'Admin' && userRole !== 'Employer')) {
         return res.status(403).json({ error: 'Access denied. Only admin or employer can create payroll.' });
     }

   
    // ensuring the Team Leader is not adding themselves
    //i need toi update this one also--done
    if (teamLeaderId.employeeId === employeeId) {
      return res.status(400).json({
        message: 'You cannot add yourself as an employee.',
      });
    }

    // required feilds
    if (!email || !fullName || !employeeId || !contactNumber || !teamLeaderId) {
      return res.status(400).json({
        message: 'Missing required fields: email, firstName, contactNumber, teamLeaderObjectId or employeeId.',
      });
    }

    // finding the employee added
    const employee = await Employee.findOne({ employeeId, email, fullName, contactNumber });
    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found. Ensure email, firstName, contactNumber and employeeId are correct.',
      });
    }

    // Finding the Team Leader by ObjectId
    const teamLeader = await Employee.findById(teamLeaderId);
    if (!teamLeader) {
      return res.status(404).json({ message: 'Team Leader not found.' });
    }

    //checking employee is not already aligned under this TL
    if (employee.teamLeader && employee.teamLeader.toString() === teamLeader.fullName) {
      return res.status(400).json({
        message: 'This employee is already aligned under the specified Team Leader.',
      });
    }

    // updating the employee TL field to the loggedin TL full name
    employee.teamLeader = teamLeader.fullName;
    await employee.save();

    // same employeeId is not already in the alignedEmployeeId array
    if (!teamLeader.alignedEmployeeId.includes(employeeId)) {
      teamLeader.alignedEmployeeId.push(employeeId); // Add the employeeId
      await teamLeader.save(); // Save the TL document
    }

    res.status(200).json({
      message: `Employee successfully added under ${teamLeader.fullName} with TL employee Id ${teamLeader.employeeId} alignment.`,
      employee,
    });
  } catch (error) {
    console.error('Error while adding employee under alignment:', error.message);
    res.status(500).json({ error: error.message });
  }
};

  
  


// getting all employees under the logged-in Team Leader
exports.getAlignedEmployees = async (req, res) => {
  try {

    const userRole = req.user?.role;
    const userDesignation = req.user?.designation;
    const userId = req.user?._id;
    
    // defining allowed team leader designations
    const teamLeaderRoles = [
      'IT Team Leader',
      'Assignment Team Leader',
      'Digital Team Leader',
      'Finance Team Leader'
    ];

    if (!userRole || (userRole !== 'Admin' && userRole !== 'Employer' && !teamLeaderRoles.includes(userDesignation))) {
      return res.status(403).json({ error: 'Access denied. Only Admin, Employer, or Team Leader can access this data.' });
    }

    let alignedEmployees;

    if (teamLeaderRoles.includes(userDesignation)) {
      // if TL is logged in, fetching their own aligned employees
      const teamLeader = await Employee.findById(userId);
      if (!teamLeader) {
        return res.status(404).json({ message: 'Team Leader not found.' });
      }
      
      const { alignedEmployeeId } = teamLeader;
      if (!alignedEmployeeId || alignedEmployeeId.length === 0) {
        return res.status(404).json({ message: 'No employees are currently aligned under your observation.' });
      }

      alignedEmployees = await Employee.find({
        employeeId: { $in: alignedEmployeeId },
      }).select('-password');
    } else {
      // if Admin or Employer is logged in, fetching all aligned employeess under a particular TL
      const { teamLeaderId } = req.query;
      if (!teamLeaderId) {
        return res.status(400).json({ message: 'Team Leader ID is required to fetch aligned employees.' });
      }

      const teamLeader = await Employee.findById(teamLeaderId);
      if (!teamLeader) {
        return res.status(404).json({ message: 'Team Leader not found.' });
      }

      const { alignedEmployeeId } = teamLeader;
      if (!alignedEmployeeId || alignedEmployeeId.length === 0) {
        return res.status(404).json({ message: 'No employees are currently aligned under this Team Leader.' });
      }

      alignedEmployees = await Employee.find({
        employeeId: { $in: alignedEmployeeId },
      }).select('-password');
    }

    res.status(200).json({
      message: 'Aligned employees retrieved successfully.',
      alignedEmployees,
    });
  } catch (error) {
    console.error('Error while fetching aligned employees:', error.message);
    res.status(500).json({ error: error.message });
  }
};

  

exports.removeEmployees = async (req, res) => {
  try {
    const { employeeIds, teamLeaderId } = req.body;

    // Checking user role
    const userRole = req.user?.role;
    if (!userRole || (userRole !== 'Admin' && userRole !== 'Employer')) {
      return res.status(403).json({ error: 'Access denied. Only Admin or Employer can remove employees from alignment.' });
    }

    // Checking required fields
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0 || !teamLeaderId) {
      return res.status(400).json({ message: 'Missing or invalid required fields: employeeIds (array) and teamLeaderId.' });
    }

    // Finding the Team Leader
    const teamLeader = await Employee.findById(teamLeaderId);
    if (!teamLeader) {
      return res.status(404).json({ message: 'Team Leader not found.' });
    }

    // Filtering employees who are actually aligned under the given Team Leader
    const employees = await Employee.find({ employeeId: { $in: employeeIds } });

    if (employees.length === 0) {
      return res.status(404).json({ message: 'No valid employees found.' });
    }

    // Filtering employees that are NOT aligned under this Team Leader
    const notAligned = employees.filter(emp => !teamLeader.alignedEmployeeId.includes(emp.employeeId));
    if (notAligned.length > 0) {
      return res.status(400).json({
        message: 'Some employees are not aligned under the specified Team Leader.',
        notAligned: notAligned.map(emp => emp.employeeId),
      });
    }

    // Removing employees from the team leader's alignedEmployeeId array
    teamLeader.alignedEmployeeId = teamLeader.alignedEmployeeId.filter(id => !employeeIds.includes(id));
    await teamLeader.save();

    // Updating each employee to remove the team leader reference
    await Employee.updateMany(
      { employeeId: { $in: employeeIds } },
      { $set: { teamLeader: null } }
    );

    res.status(200).json({
      message: `Employees successfully removed from alignment under Team Leader ${teamLeader.fullName}.`,
      removedEmployees: employees.map(emp => emp.fullName),
    });
  } catch (error) {
    console.error('Error while removing employees from alignment:', error.message);
    res.status(500).json({ error: error.message });
  }
};


// Endpoint to fetch all Team Leaders
exports.getTeamLeadList = async (req, res) => {
  try {
      // Extract companyId from the authenticated user (decoded from token)
      const companyId = req.user.companyId;  

      if (!companyId) {
          return res.status(400).json({
              success: false,
              message: "Company ID is missing in the token"
          });
      }

      // Fetching employees who have 'Team Leader' in their designation and belong to the same company
      const teamLeaders = await Employee.find({ 
          designation: /Team Leader/i, 
          companyId: companyId 
      }).select('fullName profilePhoto employeeId designation companyId');

      res.status(200).json({
          success: true,
          count: teamLeaders.length,
          teamLeaders
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message
      });
  }
};



  
  
  
  
  
  
  


