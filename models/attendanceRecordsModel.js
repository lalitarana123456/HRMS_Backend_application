const mongoose = require("mongoose");

const attendanceHistorySchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    totalWorkingHours: { type: Number, default: 0 },
    status: { type: String, enum: ["Absent", "Pending checkout", "Present"], default: "Absent" }
});

module.exports = mongoose.model('AttendanceHistory', attendanceHistorySchema);
