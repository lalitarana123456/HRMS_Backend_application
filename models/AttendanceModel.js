// // models/Attendance.js
// const mongoose = require('mongoose');

// const attendanceSchema = new mongoose.Schema(
//   {
//     employeeId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee',
//         required: true,
//       },
//       date: {
//         type: Date,
//         required: true,
//         default: Date.now,
//       },
//       onLeave: {
//         type: String,
//         enum: ['Yes', 'No'],
//         required: true,
//         default: 'No',
//       },
//       timerStart: {
//         type: Date,
//         default: null,
//       },
//       timerStop: {
//         type: Date,
//         default: null,
//       },
//       timeSpent: {
//         type: Number, // Store time in minutes or seconds
//         default: 0,
//       },
  
//     }, 
    
// { timestamps: true });

// module.exports = mongoose.model('Attendance', attendanceSchema);