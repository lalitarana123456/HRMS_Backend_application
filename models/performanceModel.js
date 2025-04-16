// const mongoose = require('mongoose');

// const monthlyPerformanceSchema = new mongoose.Schema({
//     overallPerformancePercentage: {
//         type: Number,
//         required: true
//     },
//     commentCategory: {
//         type: String,
//         required: true,
//         enum: ['Goal', 'Achievement']
//     },
//     commentText: {
//         type: String,
//         required: true
//     }
// });

// const yearlyPerformanceSchema = new mongoose.Schema({
//     overallPerformancePercentage: {
//         type: Number,
//         required: true
//     },
//     commentCategory: {
//         type: String,
//         required: true,
//         enum: ['Recommendation', 'Warning', 'Alert']
//     },
//     commentText: {
//         type: String,
//         required: true
//     },
//     taskCompletion: {
//         type: Number,
//         min: 0,
//         max: 5,
//         required: true
//     },
//     attendanceRating: {
//         type: Number,
//         min: 0,
//         max: 5,
//         required: true
//     },
//     efficiencyScore: {
//         type: Number,
//         min: 0,
//         max: 5,
//         required: true
//     },
//     teamCollaborationRating: {
//         type: Number,
//         min: 0,
//         max: 5,
//         required: true
//     }
// });

// const MonthlyPerformance = mongoose.model('MonthlyPerformance', monthlyPerformanceSchema);
// const YearlyPerformance = mongoose.model('YearlyPerformance', yearlyPerformanceSchema);

// module.exports = { MonthlyPerformance, YearlyPerformance };
