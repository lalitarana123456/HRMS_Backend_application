const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//  here i am genearting  jwt 
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//  here doing signup
const signup = async (req, res) => {
  const { name, email, password, phone, address, dateOfJoining, role } = req.body;

  try {
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) return res.status(400).json({ message: 'Employee already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      dateOfJoining,
      role,
      employeeId: `EMP${Date.now()}`, // Generate random employee id 
    });

    res.status(201).json({ token: generateToken(employee._id), message: 'Employee registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating employee.', error: err.message });
  }
};

//  here i am doing 
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if(!email || !password){
      return res.status(400).json({message: 'Email and Password is required for login!'});
    }
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    res.json({ token: generateToken(employee._id), role: employee.role, employeeData:employee});
  } catch (err) {
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
};

// Logout 
const logout = (req, res) => {
  res.json({ message: 'Logout .' });
};

module.exports = { signup, login, logout };

