// //importing  mongoose for Schema definition
// const mongoose = require('mongoose'); 
//--------------------------------------------------We don't need right now so commenting out-------------------------------------

// //defining payslip schema
// const payslipSchema = new mongoose.Schema({

//     employeeId:{
//         type:String, 
//         required:true
        
//     },
//     employeeName:{
//         type:String, 
//         required: true
//     },
//     payrollRuns:{
//         type: String,
//         // required:true,
//         // validate:{
//         //     validator: function(value){
//         //         return !this.isNaN(new Date(value).getTime());
//         //     },
//         //     message: (props) => `${props.value} is not a valid date!`
//         // }
        
//     },
//     payType:{
//         type: String,
//         //enum:['Leave', 'Medical Leave', 'Half Day', 'Regular'],
//         required:true
//     },
//     hoursWorked:{
//         type:Number,
//         required:true
//     },
//     hourlyRate:{
//         type:Number,
//         required: true
//     },
//     deductions:{
//         type: Number,
//         required:true
//     },
//     netSalary:{
//         type:Number,
//         required:true
//     },
//     grossSalary:{
//         type:Number,
//         required:true
//     },
//     action:{
//         type:String,
//         required: true
//     },
//     generatedaAt:{
//         type:Date,
//         default: Date.now
//     }
// });

// //exporting the model
// module.exports = mongoose.model('Payslips', payslipSchema);