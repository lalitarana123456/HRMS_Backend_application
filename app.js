const express = require('express');
const dotenv = require('dotenv');
//dotenv.config();
require('dotenv').config();
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const payslipRoutes = require('./routes/payslipRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const upcomingLeavesRoutes = require('./routes/upcomingLeaveRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const attendenceRoutes = require('./routes/attendanceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const otpRoutes = require('./routes/otpRoutes');
const employeeIdRoutes = require('./routes/employeeIdRoutes');
const employeecountRoutes = require('./routes/employeecountRoutes');
const administrativeAttendanceRoutes = require('./routes/administrativeAttendanceRoutes')
const teamLeaderRoutes = require('./routes/teamLeaderRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const administrativePayrollRoutes = require('./routes/administrativePayrollRoutes');
const administrativeLeaveRoutes = require('./routes/adiministrativeLeaveRoutes');
const getTeamPerformance = require("./routes/administrativeTeamPerformanceRoutes.js");
const getPerformanceRoutes = require('./routes/administrativePerformanceSheetRoutes');
// const getEmployeeDetails = require('./routes/administrativePayslipRoutes')
const bucketRoutes = require('./routes/bucketRoutes.js');
const requestLeavesRoutes = require('./routes/requestLeavesRoutes')
const companyProfileRoutes = require('./routes/companyProfileRoutes');
const onleaveRoutes = require('./routes/onleaveRoutes');

const getTotalEmployeesPresent =require('./routes/administrativeFullAttendanceRoutes.js')
const filterSort = require('./routes/employeeFiltersRoute.js')
const attendanceRecordsRoutes = require('./routes/attendanceRecordsRoutes.js');
const eventRoutes = require('./routes/eventRoutes.js');

const ratingSort = require('./')

const allowedOrigins = [
    "http://13.232.165.81:5000/",
    "http://localhost:5173",
    "http://localhost:5174"

]

dotenv.config();
connectDB();
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));



//Employee Routes
app.use('/api/v1/auth', authRoutes);

//Company Routes -  creation of companyId by admin for employee
app.use('/api/v1/company', companyRoutes);

//Admin Routes 
app.use('/api/v1/admin', adminRoutes);

//Admin Routes 
app.use('/api/v1/teamLeader/employees', teamLeaderRoutes);

//Admin AuthRoutes
app.use('/api/v1/admin/auth', adminAuthRoutes);

//Payslip Routes
app.use('/api/v1/payslips',payslipRoutes);

//Leave Routes
app.use('/api/v1/leaves', leaveRoutes);

//Upcomming Leaves Routes
app.use('/api/v1/leaves/upcoming', upcomingLeavesRoutes);

//Performance Routes
app.use('/api/v1/performances', performanceRoutes);

//Attendence Routes
app.use('/api/v1/attendence', attendenceRoutes);

//Analytics Routes
app.use('/api/v1/analytics', analyticsRoutes);

//middleware 
app.use('/uploads', express.static('uploads'));

// compnay id geneartion routes 
app.use('/api/v1/company', companyRoutes);

// employee reset password  routes 
app.use('/api/v1/employee', employeeRoutes);

// routes to generate otp 
app.use('/api/v1/otp', otpRoutes);

//routes to create employee
app.use('/api/v1/employees', employeeIdRoutes);

app.use('/api/v1/employees', filterSort)

// routes to count total employee
app.use('/api/v1/employees' , employeecountRoutes);

// routes to post announcement 
app.use('/api/v1/announce', announcementRoutes);

app.use('/api/v1/administartive/attendance', administrativeAttendanceRoutes);

app.use('/api/v1/administrative/payroll', administrativePayrollRoutes);
 // routes to onleaves request 
  
app.use('/api/v1/leaves' ,requestLeavesRoutes )
   
// routes to upload profile photo in s3 bucket 
app.use('/api/v1/s3',bucketRoutes);

//routes for administrative full attendance 
app.use('/api/v1/administrative/full-attendance',getTotalEmployeesPresent)

app.use('/api/v1/administrative/leaves', administrativeLeaveRoutes);

// Routes for administrative team performance
app.use('/api/v1/administrative/performance', getTeamPerformance);

//Routes for administrative performance sheet
app.use('/api/v1/perform', getPerformanceRoutes);

app.use('/api/v1/companyProfile' , companyProfileRoutes);

// routes to find onleaves empoyee
app.use('/api/v1/leaves',onleaveRoutes);


app.use('/api/v1/administartive/attendance/records', attendanceRecordsRoutes);
  // event routes 
app.use("/api/v1/upcomingevent", eventRoutes);

//global error handler
app.use(errorHandler);

app.all("*", (req, res) => {
    res.status(404).json({
        error: "Invalid route",
        message: `The path '${req.originalUrl}' is not found on this server.`,
    });
});



module.exports = app;