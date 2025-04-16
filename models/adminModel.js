const mongoose = require('mongoose');



const adminSchema = new mongoose.Schema({
    FullName:{
        type:String,
        required:true,
        validate:{
            validator: function(value){
                return /^[a-zA-Z]{3,}$/.test(value);//No number or special character, minimum 3 charaters
            },
            message: props => `${props.value} is not a valid first name!`
        }

    },
    gender:{
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Others']
    },
    userName:{
        type:String,
        //required:true,
        
    },
    role:{
        type:String,
        enum:['Admin'],
        default:'Admin'
        
    },
    email:{
        type:String,
        //required:true,
        unique: true, 
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email address!'] //email format for validation
    },
    password:{
        type:String,
        //required: true,
        minlength: [8, 'Password should be at least 8 characters long!'],
        validate: {
            validator: function(value) {
                return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value); // Ensuring password has at least 1 uppercase, 1 lowercase, and 1 number
            },
            message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number!'
        }
    },
    contactNumber:{
        type:String,
        //required:true,
        validate: {
            validator: function(value) {
                return /^\d{10}$/.test(value); // Only numeric values, exactly 10 digits
            },
            message: props => `${props.value} is not a valid contact number!`
        }
    },

}, {timestamps:true});



module.exports = mongoose.model('Admin', adminSchema);




