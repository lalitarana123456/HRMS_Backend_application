const jwt = require('jsonwebtoken');
const Employee = require('../models/employeeModel');
const Admin = require('../models/adminModel');
const Company = require('../models/adminCreateCompanyIdModel');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized access. Token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = null;

    // Fetch user from relevant collections
    if (!user) user = await Admin.findById(decoded.id).select('-password');
    if (!user) user = await Company.findById(decoded.id).select('-password');
    if (!user) user = await Employee.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // const teamLeaderRoles = [
    //   'IT Team Leader',
    //   'Assignment Team Leader',
    //   'Digital Team Leader',
    //   'Finance Team Leader'
    // ];

    // Check for Team Leader designation
    //const isTeamLeader = user.designation && user.designation.includes('Team Leader');
    //const isTeamLeader = user.designation && user.designation.includes(teamLeaderRoles);

    req.user = {
      ...user.toObject(),
      _id: user._id, // Adding _id to req.user for compatibility
      id: user._id,  // Retaining id for other use cases
      role: decoded.role || user.role || (isTeamLeader ? 'Team Leader' : 'Employee'),
      companyId: user.companyId || null,
      designation: user.designation || null,
      department: user.department || null,
    };

    

    next();
  } catch (error) {
    console.error('Error in token verification:', error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};


// Role-Based Access Middleware
const roleAccess = (roles) => (req, res, next) => {
  
  if (!req.user || !roles.includes(req.user.role) ) {
    return res.status(403).json({ message: 'Access forbidden: insufficient privileges.' });
  }
  next();
};

module.exports = { protect, roleAccess };




//  //Role-based Access
// const roleAccess = (roles) => (req, res, next) => {
  
//   if (!req.user || !roles.includes(req.user.role) || !departments.includes(req.user.department)) {
//     return res.status(403).json({ message: 'Access forbidden: insufficient privileges.' });
//   }
//   next();
// };


