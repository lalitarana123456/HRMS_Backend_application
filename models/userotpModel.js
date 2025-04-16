const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Userotp', userSchema);
