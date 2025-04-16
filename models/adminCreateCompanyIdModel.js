const mongoose = require('mongoose');

const companyAdminSchema = new mongoose.Schema({
  Name: {
    type: String,
    //required: true,
  
  },
  email: {
    type: String, 
    unique: true,
    //required:true,
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email address!'] //email format for validation
  },
  sectorName:{
    type:String,
    //required: true,
  },
  phoneNumber:{
    type: String, 
    //required:true,
    validate: {
      validator: function(value) {
        return /^\d{10}$/.test(value); // Only numeric values, exactly 10 digits
      },
      message: props => `${props.value} is not a valid contact number!`
    }
  },
  establishedOn:{
    type:Date,
    //required: true,
  },
  password: {
    type: String,
    //required: true,
    
  },
  role:{
    type:String,
    enum:['Employer'],
    default:'Employer'
    
  },
  ownerName: {
    type: String,
    //required: true,
  },
  domainEmail:{
    type: String,
  },
  personalEmail: {
    type: String,
    //required: false,  // Optional field, can be null
  },
  description: {
    type: String,
    //required: true,
  },
  industryType: {
    type: String,
    enum: ['account', 'software', 'social media'],
    //required: true,
  },
  address: {
    type: String,
    //required: true,
  },
  logo: {
    type: String,
    //required: false,  // Logo is optional
  },
  password:{
    type:String
  },
  companyId: { 
      type: String, 
      //required: false, 
      unique: true 
  },
});

module.exports = mongoose.model('companyAdmin', companyAdminSchema);