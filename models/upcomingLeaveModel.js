const mongoose = require('mongoose');


//creating upcomming leave
const upcomingLeaveSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, 
    },
    date: {
        type: Date,
        required: true,  
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String, 
    }
    
    // fromDate:{
    //     type: Date,
    //     //required: true,

    // },
    // toDate:{
    //     type: Date,
    //     //required: true,
    // },

});


module.exports = mongoose.model('UpcomingLeave', upcomingLeaveSchema);