const Admin = require('../models/adminModel');
const Company = require('../models/adminCreateCompanyIdModel');
const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//generating JWT token 
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//Admin register
const registerAdmin = async (req, res) => {
  const { FullName, userName, gender, email, password, contactNumber, role } = req.body;

  try {

    if(!FullName || !userName || !gender || !email || !password || !contactNumber){
      return res.status(404).json({message:"FullName, userName, gender, email, password, contactNumber, role is required"});
    }
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      FullName,
      email,
      password: hashedPassword,
      contactNumber,
      userName,
      gender,
      role,
      adminId: `ADM${Date.now()}`, // Generate random adminId 
    });

    res.status(201).json({message: 'Admin registered successfully.', data: admin});
  } catch (err) {
    res.status(500).json({ message: 'Error creating admin.', error: err.message });
  }
};

const loginAdmin = async (req, res) => {
  const { userName, password, email } = req.body;

  // Require at least one of email or username, and password
  if ((!email && !userName) || !password) {
    return res.status(400).json({ message: 'Email and password or username are required.' });
  }

  try {
    let user;
    let role;

    if (userName) {
      // Admin login
      user = await Admin.findOne({ userName }); // Ensure correct field name
      role = user ? 'Admin' : null;
    } else {
      // Employer login
      user = await Company.findOne({ email });
      role = user ? 'Employer' : null;

      // Employee and Team Leader login
      if (!user) {
        user = await Employee.findOne({ email });
        role = user ? user.role : null; // `role` will be either 'Employee' or 'Team Leader'
      }
    }

    // If no user is found
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Compare passwords for all roles
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create JWT payload
    const tokenPayload = { id: user._id, role };
    if (role === 'Employer') tokenPayload.companyId = user.companyId;
    if (role === 'Team Leader' || role === 'Employee') tokenPayload.companyId = user.companyId || null;
    //if (role === 'Team Leader' || role === 'Employee') tokenPayload.companyId = user.companyId || null;

    // Sign JWT
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });
    const department = user.department;
    const designation = user.designation;
    res.status(200).json({
      token,
      role,
      companyId: tokenPayload.companyId || null,
      department,
      designation,
      employeeData:user,
    });
  } catch (err) {
    console.error('Error in login:', err.message);
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
};





module.exports = { registerAdmin, loginAdmin };