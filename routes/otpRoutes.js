const express = require('express');
const { generateAndSendOTP, verifyOTP, getRemainingOTPTimer} = require('../controllers/otpController');

const router = express.Router();

// Route to generate and send OTP
router.post('/send-otp', generateAndSendOTP);

// Route to verify OTP
router.post('/verify-otp', verifyOTP);

//Route to get OTP tIMER 
router.post('/otp-timer', getRemainingOTPTimer);

module.exports = router;
