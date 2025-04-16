const Employee = require('../models/employeeModel');
const User = require('../models/userotpModel');
const nodemailer = require('nodemailer');


// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Configure Nodemailer with Hostinger SMTP
const sendEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com', // Hostinger's SMTP server
    port: 465, // Port for SSL
    secure: true, // Use SSL
    auth: {
      user: process.env.HOSTINGER_EMAIL, // Hostinger email
      pass: process.env.HOSTINGER_PASSWORD, // Hostinger email password
    },
  });

  const mailOptions = {
    from: process.env.HOSTINGER_EMAIL,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for 2 minutes.`,
  };

  return transporter.sendMail(mailOptions);
};

// Generate and send OTP
exports.generateAndSendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Check if the email exists in the Employee collection
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ error: 'Email does not exist in the Employee database.' });
    }

    // Generate and save OTP in the User collection
    const otp = generateOTP();
    const otpExpiresAt = Date.now() + 2 * 60 * 1000; // OTP valid for 2 minutes

    await User.findOneAndUpdate(
      { email },
      { email, otp, otpExpiresAt },
      { upsert: true, new: true } // Create a new document if one doesn't exist
    );

    // Send OTP to the user's email
    await sendEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
};


// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
};

exports.getRemainingOTPTimer = async (req, res) =>{
  try{

    //trying to extract the email from the req
    const { email } = req.body;

    //if email we are not getting 
    if(!email){
      return res.status(400).json({error: 'Email is required.'});
    }


    //checking email exist in the employee collection or not
    const employee = await Employee.findOne({email});
    if(!employee) {
      return res.status(400).json({error:'Please provide existing email:  Email does not exist in the employee database'});
    }

    //checking if an OTP exists for the same email in the uerOTP collection
    const otpRecord = await User.findOne({email});
    if(!otpRecord || !otpRecord.otpExpiresAt){
      return res.status(404).json({error: 'No valid OTP found for this email.'});
    }
    

    //calculating remaining OTP tijme
    const currentTimer = Date.now();
    const otpExpiresAt = new Date(otpRecord.otpExpiresAt).getTime();
    //calculating the remaining time in seconds
    const remainingTime = Math.max(0, Math.floor((otpExpiresAt - currentTimer) / 1000));

    //if OTP has expired
    if(remainingTime === 0){
      return res.status(400).json({error: 'OTP has expired.'});
    }

    //responding with remaining time.
    res.status(200).json({message:"OTP is valid.", remainingTime});
    
  }catch(error){

    console.error(error);
    res.status(500).json({error: 'Failed to fetch the OTP timer.'});
  }
}
