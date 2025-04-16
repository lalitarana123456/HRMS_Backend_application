const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Update Password
const updatePassword = async (req, res) => {
  try {
    // extrating oldPassword and newPassword from request body
    const { oldPassword, newPassword } = req.body;
    //console.log(req.user.role);
    // checking logged in employee only
    if (req.user.role !== 'Employee') {
      return res.status(403).json({ message: 'Access forbidden: Only employees can update their password.' });
    }


    //getting employee by Id
    const employee = await Employee.findById(req.user._id);

    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // comparing the provided old password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(oldPassword, employee.password);

    //old password not matching then error
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }

    // hashing the new password before saving it to the database
    employee.password = await bcrypt.hash(newPassword, 10);

    // saving the updated employee record
    await employee.save();

   
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    //testing part
    console.error('Error while updating password:', err.message);

    //testing part
    res.status(500).json({
      message: 'Error updating password.',
      error: err.message,
    });
  }
};



// here  we do resting of password ,
const resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  try {
    // Ensure email, newPassword, and confirmPassword are provided
    if (!email || !newPassword || !confirmPassword) {
      console.error('Missing required fields.');
      return res.status(400).json({ message: 'Email, new password, and confirm password are required.' });
    }

    // Ensure newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      console.error('Password mismatch.');
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Find the employee with the given email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      console.error(`Employee not found with email: ${email}`);
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Hash the new password and update it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    employee.password = hashedPassword;
    await employee.save();

    console.log(`Password reset successfully for email: ${email}`);
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

//adding endpoints regarding uploading profile photo
const uploadProfilePicture = async (req, res) =>{

  try{

    if(!req.file){
      return res.status(400).json({message: 'Please upload a file.'});

    }

    //admin uploading a profile picture for a specific employee
    let employee;
    if(req.user.role === 'Admin'){
      const employeeId = req.body.employeeId || req.query.employeeId;

      if(!employeeId){
        return res.status(400).json({message: 'Emplopyee Id is required for admin action.'});
      }

      employee = await Employee.findById(employeeId);
      if(!employee){
        return res.status(404).json({message: 'Employee not found.'});
      }

    }else{

      //employee will upload thier own profile pic
      employee = await Employee.findById(req.user.id);
      if(!employee){
        return res.status(404).json({message: 'Employee not found.'});
      }
    }

    //updating employee's profile picture
    employee.photo = req.file.path;
    await employee.save();

   
    res.status(200).json({
      message: 'Profile picture uploaded successfully.',
      photo: req.file.path,
    });


  }catch(error){
    console.error('Error uploading profile picture:', error.message);
    res.status(500).json({message: 'Server error. Please try again later.'});

  }
}
module.exports = {  updatePassword, resetPassword, uploadProfilePicture };

