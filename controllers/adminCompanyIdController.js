require('dotenv').config(); 
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Company = require('../models/adminCreateCompanyIdModel');

const generateCompanyId = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  const randomLetter = () => letters[crypto.randomInt(0, letters.length)];
  const randomDigit = () => digits[crypto.randomInt(0, digits.length)];

  return `${randomLetter()}${randomDigit()}${randomLetter()}${randomDigit()}`;
};

// Configure Nodemailer for Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com', // Hostinger's SMTP server
  port: 465, // Secure port for SSL
  secure: true, // Use SSL
  auth: {
    user: process.env.HOSTINGER_EMAIL, // Hostinger email
    pass: process.env.HOSTINGER_PASSWORD, // Hostinger email password
    
  },
});

const registerCompany = async (req, res) => {
  // Ensure the user is an admin
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access forbidden: only admins can create companyId.' });
  }

  const { Name, email, password, confirmPassword } = req.body;

  // Validate input fields
  if (!Name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure companyId uniqueness
    let companyId;
    let isUnique = false;

    while (!isUnique) {
      companyId = generateCompanyId();
      const existingCompany = await Company.findOne({ companyId });
      if (!existingCompany) isUnique = true;
    }

    // Create and save the new company
    const newCompany = new Company({
      Name,
      email,
      password: hashedPassword,
      companyId,
    });

    await newCompany.save();

    // Send email with the company ID
    const mailOptions = {
      from: process.env.HOSTINGER_EMAIL, // Hostinger email address
      to: email,
      subject: 'Your Company ID',
      text: `Dear ${Name},\n\nYour company has been successfully registered. Your unique Company ID is: ${companyId}.\n\nThank you for registering with us.\n\nBest regards,\nThe Assigner Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error.message);
        return res.status(500).json({ message: 'Error sending email. Company registered successfully, but email could not be sent.' });
      }
      console.log('Email sent:', info.response);
    });

    res.status(201).json({
      message: 'Company registered successfully! Company ID has been sent to the registered email.',
      companyId,
    });
  } catch (error) {
    console.error('Error during company registration:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { registerCompany };
