// //Import mongoose for schema defining
// const mongoose = require('mongoose');
//--------------------------------------------------We don't need right now so commenting out-------------------------------------
// //Defining the Leave Schema
// const leaveSchema = new mongoose.Schema({
//     employeeId: {
//         type: String,
        
//     },
//     employeeName: {
//         type: String,
//         required: true
//     },
//     leaveType: {
//         type: String,
//         required: true,
//         enum: ['Maternity', 'Sick Leave', 'Emergency']
//     },
//     startDate:{
//         type: Date, 
//         required: true
//     },
//     endDate:{
//         type: Date, 
//         required: true
//     },
//     status:{
//         type: String, 
//         default: 'Pending', 
//         enum: ['Pending', 'Approved', 'Denied']
//     },
//     leaveBalance: {
//         type: Number,
//         default: 10,
//         leaveHistory:[{leaveType: String, startDate: Date, endDate: Date, status: String}]
//     },
//     leaveHistory:[
//         {
//             leaveType:String,
//             startDate: Date,
//             endDate: Date,
//             status:String
//         }
//     ],
//     description:{
//         type: String,
//         required: true
//     },
//     createdAt:{
//         type: Date, 
//         default: Date.now
//     }

// });


// //exporting module
// module.exports = mongoose.model('Leave', leaveSchema);
