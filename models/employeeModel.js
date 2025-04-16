const mongoose = require('mongoose');
const assignDesignation = require('../middleware/assignDesignationMiddleware');
const assignSalary = require('../middleware/assignSalaryMiddleware');

//leave schema
const leaveSchema = new mongoose.Schema({

    leaveType: {
        type: String,
        enum: ['Maternity Leave', 'Sick Leave', 'Emergency Leave', 'Personal Leave', 'Menstrual Leave', 'Bereavement Leave'],
        required: true,
    },
    paidOrUnpaidType:{
        type: String,
        enum:['Paid', 'Unpaid'],//I need to check with the condition of paid or unpaod already defined codition
    },
    startDate:{
        type: Date, 
        required: true
    },
    endDate:{
        type: Date, 
        required: true
    },
    status:{
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Approved', 'Rejected']
    },
    leaveBalance: {//I need to make it dynamic 
        type: Number,
        default: 10,
        
    },
    description:{
        type:String,
        required:true,
    },
    rejectionReason: {
        type: String, // storing the reason if rejected
        //required: function() { return this.status === 'Rejected'; } // required only if status is 'Rejected'
    },
    createdAt:{
        type: Date, 
        default: Date.now
    },
    documents: [{ type: String }],
});

//defining payslip schema
const payRollSchema = new mongoose.Schema({

    payrollRuns:{ 
       type: Date,
       //required: true,
    },
    payType:{
        type: String,
        enum:['Leave', 'Medical Leave', 'Half Day', 'Holiday', 'Full Day'],
        //required:true
    },
    hoursWorked:{
        type:Number,
        //required:true
    },
    hourlyRate:{
        type:Number,
        //required: true
    },
    deductions:{
        type: Number,
        //required:true
    },
    netSalary:{//Earning
        type:Number,
        //required:true
    },
    grossSalary:{//Change to TotalPay
        type:Number,
        //required:true
    },
    status:{//it will depend on type ...1 - Holiday(Paid), 2 - Leave(Unpaid), 3 - Medical Leave(Paid), Half Day(Half paid)
        type:String,
        enum: ['Paid', 'Unpaid', 'Half Paid', 'Holiday'],
        //required: true,
        //required: true
    },
    oneDayPay:{
        type: Number, 
        //required: true,
    },
    description:{
        type: String,
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    documents: [{ type: String }],
    
    
});

//Monthly performance Schema
const monthlyPerformanceSchema = new mongoose.Schema({
    overallPerformancePercentage: {
        type: Number,
        required: true,
        default:1,
    },
    commentCategory: {
        type: String,
        required: true,
        enum: ['Goal', 'Achievement']
    },
    commentText: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true,
        enum: [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ],
        set: function(value) {
            const monthAbbreviations = {
                'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr', 'May': 'May',
                'June': 'Jun', 'July': 'Jul', 'August': 'Aug', 'September': 'Sep', 'October': 'Oct',
                'November': 'Nov', 'December': 'Dec'
            };
            return monthAbbreviations[value] || value;  // Convert to 3-letter abbreviation
        }
    },
    year: {
        type: Number,
        default: new Date().getFullYear(),//now it is required, for overall year performance percentage
    }
}, { 
    toJSON: { getters: true }, 
    toObject: { getters: true }  
});


//Yeary Performance Schema
const yearlyPerformanceSchema = new mongoose.Schema({
    overallPerformancePercentage: {
        type: Number,
        //required: true
    },
    commentCategory: {
        type: String,
        required: true,
        enum: ['Recommendation', 'Warning', 'Alert']
    },
    commentText: {
        type: String,
        required: true
    },
    taskCompletion: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    attendanceRating: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    efficiencyScore: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    teamCollaborationRating: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    overallStarRating:{
        type:Number,
        require:true
    }
});

// Attendance Schema


const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now,
      },
      onLeave: {
        type: String,
        enum: ['Yes', 'No'],
        required: true,
        default: 'No',
      },
      firstCheckIn:{
        type: Date,
        default: null,
      },

      timerStart: {
        type: Date,
        default: null,
      },
      timerStop: {
        type: Date,
        default: null,
      },
      timeSpent: {
        type: Number, // Store cumulative time in HH:MM:SS format
        default: 0,
      },
    }, {
      timestamps: true,
    });

//Employee Schema
const employeeSchema = new mongoose.Schema({

    firstName: { 
        type: String,  
        //required:true,
        validate:{
            validator: function(value){
                return /^[a-zA-Z]{3,}$/.test(value);//No number or special character, minimum 3 charaters
            },
            message: props => `${props.value} is not a valid first name!`
        }
    },
    lastName: { 
        type: String,
        //required:true,
        validate:{
            validator: function(value){
                return /^[a-zA-Z]{3,}$/.test(value);//No number or special character, minimum 3 charaters
            },
            message: props => `${props.value} is not a valid first name!`
        }  
    },
    gender: { 
        type: String, 
        enum: ['Male', 'Female', 'Other'],
        //required: true, 
    }, 
    fullName: { 
        type: String,
    },
    employeeId: { 
        type: String,
        //required: true,
        unique: true, 
    },
    email: { 
        type: String, 
        unique: true,
        //required:true,
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email address!'] //email format for validation 
    },
    password: { 
        type: String,
        //required: true, 
    },
    confirmPassword: { 
        type: String, 
    },
    companyId: { 
        type: String,
    
    },
    dateOfJoining: { 
        type: Date,
        //required: true,
    },
    role: { 
        type: String,
        enum:['Employee', 'Team Leader'], 
        default: 'Employee'
    },
    employeeStatus: { 
        type: String, 
        //required: true,
        enum: ['Full Time', 'Intern', 'Part Time']
    },
    averageWorkingHours :{
        type:Number,
        default: 8
    },
    notifications: [
        {
            title: { 
                type: String, 
             },
            message: {
                type:String
            },
            
        }
    ],
    alternativeNumber: { 
        type: String, 
        //required:true,
        validate: {
            validator: function(value) {
                return /^\d{10}$/.test(value); // Only numeric values, exactly 10 digits
            },
            message: props => `${props.value} is not a valid contact number!`
        } 
    },//any operation is only possible by admin
    contactNumber: { 
        type: String, 
        //required:true,
        validate: {
            validator: function(value) {
                return /^\d{10}$/.test(value); // Only numeric values, exactly 10 digits
            },
            message: props => `${props.value} is not a valid contact number!`
        } 
    },//any operation is only possible by admin
    address: { 
       postalCode:{
        type:String,
        //required: true,
        validate:{
            validator: function(value){
                return /^\d{5,6}$/.test(value); //validating 5-6 digit of postal code only.
            },
            message: props => `${props.value} is not a valid postal code! It should be 5-6 digit only.`
        },
       },
       city:{
        type:String,
        //required: true,
       },
       completeAddress:{
        type:String,
        //required:true,
       },
    },
    designation: { 
        type: String,
        enum:['Human Resources', 
            'Research Writer', 
            'Finance Analyst', 
            'Lead Generation', 
            'Digital Marketing', 
            'Business Development Executive', 
            'Frontend Developer', 
            'Backend Developer', 
            'Full stack Developer', 
            'UI & UX designer', 
            'Python Developer', 
            'UI/UX',
            'Front-End',
            'Back-End',
            'Research',
            'HR',
            'Social Media',
            'IT',
            'Assignment Team Leader',
            'Digital Team Leader',
            'Finance Team Leader',
            'IT Team Leader'] 
    },
    department: { 
        type: String,
        enum: ['IT Department', 'Finance Department', 'Assignment Department', 'Digital Marketing Department'],   
        
    },
    teamLeader: { 
        type: String,
    },
    dateOfBirth:{
        type:Date,
    },
    leaveBalance:{
        type:Number,
        default:10,
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline', // Default is offline
    },
    checkIn: { type: Date },  // Stores check-in timestamp
    checkOut: { type: Date }, // Stores check-out timestamp
    salaryDeduction:{
        type: Number
    },
    salary:{
        type: Number, 
        //required: true,
    },
    yearlyOverallPerformancePercentage: {
        type: Number,
        default: 0
    },
    year: {
        type: Number,
        default: new Date().getFullYear(),//now it is required, for overall year performance percentage
    },
    //attendanceHistory:[],
    profilePhoto: { 
        type: String,
    },
    alignedEmployeeId:{
        type: [String],
        default: [],
    },
    leaves: [leaveSchema], // Leave records
    attendance: [attendanceSchema],//daily attendence log
    payrollHistory: [payRollSchema], // Daily payroll records, it will be store the edge cases of four types.
    monthlyPerformance: [monthlyPerformanceSchema],//performance - monthly
    yearlyPerformance: [yearlyPerformanceSchema],//yearly performance
    
});

employeeSchema.pre('save', function (next) {
    if (this.firstName && this.lastName) {
      this.fullName = `${this.firstName} ${this.lastName}`;
    }
    next();
});


employeeSchema.pre('save', function (next) {

    //getting current year 
    const currentYear = new Date().getFullYear();
    
    // filtering only current year monthly performance records
    const yearlyRecords = this.monthlyPerformance.filter(perf => perf.year === currentYear);
    
    if (yearlyRecords.length > 0) {
        const totalPercentage = yearlyRecords.reduce((sum, perf) => sum + perf.overallPerformancePercentage, 0);
        this.yearlyOverallPerformancePercentage = totalPercentage / yearlyRecords.length;
    } else {
        this.yearlyOverallPerformancePercentage = 0;
    }

    next();
});



// middleware to set role based on department
// employeeSchema.pre('save', function (next) {
//     // checking if the department is "Team Leader"
//     if (this.designation === 'Assignment Team Leader' || this.designation === 'Digital Team Leader' || this.designation === 'Finance Team Leader' || this.designation === 'IT Team Leader' ) {
//       this.role = 'Team Leader'; // automatically it will set role as "Team Leader"
//     } else {
//       this.role = 'Employee'; // and for rest all other departments, set role as "Employee"
//     }
//     next(); //moving to the next middle-ware
//   });

//hooks to auto-assign designation before saving
//employeeSchema.pre('save', assignDesignation);

//hooks to auto-assign salary before saving
//employeeSchema.pre('save', assignSalary);


module.exports = mongoose.model('Employee', employeeSchema);