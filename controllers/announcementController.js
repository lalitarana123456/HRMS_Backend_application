const Announcement = require('../models/announcementModel.js');
const Employee  = require('../models/employeeModel');
// Post announcement 
const jwt = require('jsonwebtoken'); // For token decoding
//const Announcement = require('../models/Announcement'); // Assuming your Announcement model is defined elsewhere

exports.postAnnouncement = async (req, res) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Assumes token is in the form "Bearer <token>"
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace JWT_SECRET with your actual secret
    req.user = decoded; // Store the decoded user info in req.user

    // Check if the user is an Admin or Employer
    if (!req.user || !['Admin', 'Employer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only Admins and Employers can post announcements' });
    }

    // Assign companyId for Employer, Admin doesn't need one
    const companyId = req.user.role === 'Admin' ? null : req.user.companyId;

    // Validate Employer's companyId
    if (req.user.role === 'Employer' && !companyId) {
      return res.status(403).json({ message: 'Employer must have a companyId.' });
    }

    // Create and save the announcement
    const announcementData = { ...req.body, companyId };
    const announcement = new Announcement(announcementData);
    await announcement.save();

    res.status(200).json({ message: 'Announcement posted successfully', announcement });
  } catch (error) {
    // If the error is related to the token, e.g., invalid or expired
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//  here fetching the announcement 
//const Announcement = require('../models/Announcement');
//const Employee = require('../models/Employee');


exports.getAnnouncements = async (req, res) => {
  try {
    // Fetch announcements that have not expired
    const announcements = await Announcement.find({ expiresAt: { $gt: new Date() } });

    // If no valid announcements are found
    if (!announcements.length) {
      return res.status(404).json({ message: 'No valid announcements found' });
    }

    // Get the count of employees to ensure employees exist
    const employeeCount = await Employee.countDocuments();

    // If no employees exist, return an appropriate message
    if (employeeCount === 0) {
      return res.status(404).json({ message: 'No employees found' });
    }

    // Respond with the announcements sent to all employees
    res.status(200).json({
      message: 'Announcements fetched successfully and sent to all employees',
      announcements,
    });
  } catch (error) {
    // Log and handle errors
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
