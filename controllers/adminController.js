const Employee = require('../models/employeeModel');
const Company = require('../models/adminCreateCompanyIdModel');


exports.getEmployeeById = async (req, res) =>{

    

    //trying to extract the objectId from the req parameter
    const { id } = req.params;

    try{

        //finding the employee Id
        const employee = await Employee.findById(id);

        //checking if the employee exists
        if(!employee){
            return res.status(404).json({message: 'Employee not found.'});

        }

        //formating the dateOfJoining to DD/MM/YYYY
        const formattedEmployee = {
            ...employee.toObject(),
            dateOfJoining: new Intl.DateTimeFormat('en-GB').format(new Date(employee.dateOfJoining)),
        }

        //rteturn the employee details
        res.status(200).json(formattedEmployee);
    }catch(error){
        console.log(error.message);
        res.status(500).json({message: 'Server error: could not able to retrive employee data'});
    }


}


//Get All Employees
exports.getAllEmployees = async (req, res) =>{

    
    
    try{

        const { role, companyId } = req.user;

        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

         //filter as per the loggedin user 
        let filter = {};
        if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        } else if(role === 'Admin') {
            filter.companyId = null;
        }
        
        const employees = await Employee.find(filter);
        res.status(200).json({message: "All employee successfully fetched", data: employees});

    }catch(error) {
        console.error('Error during getting all employee:', error.message);
        res.status(500).json({error: error.message});

    }
};


//Edit Employee
exports.editEmployee = async (req, res) => {
    try {

        //role Access Control
        const { role, companyId } = req.user;
        
        if (!role || (role !== "Admin" && role !== "Employer")) {
            return res.status(403).json({ error: "Access denied. Only Admin or Employer can access this data." });
        }

        const { id } = req.params;
        const {
            firstName,
            lastName,
            employeeId,
            email,
            contactNumber,
            alternativeNumber,
            gender,
            employeeStatus,
            dateOfJoining, // Received in DD-MM-YYYY format
            designation,
            department,
            teamLeader,
            salary,
        } = req.body;

        // Convert dateOfJoining (DD-MM-YYYY) to a valid Date object
        let parsedDate;
        if (dateOfJoining) {
            const [day, month, year] = dateOfJoining.split('/'); // Split by hyphen ('-')
            parsedDate = new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format for Date parsing

            // Validate the parsed date
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format for dateOfJoining' });
            }
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            {
                employeeId,
                firstName,
                lastName,
                email,
                contactNumber,
                alternativeNumber,
                gender,
                employeeStatus,
                dateOfJoining: parsedDate, // Save the valid Date object
                designation,
                department,
                teamLeader,
                salary
            },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Send a consistent date format in the response (optional)
        if (updatedEmployee.dateOfJoining) {
            updatedEmployee.dateOfJoining = updatedEmployee.dateOfJoining.toISOString().split('T')[0]; // YYYY-MM-DD format
        }

        res.status(200).json({
            message: 'Employee updated successfully',
            employee: updatedEmployee,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//list of employee as per the companyId
exports.listOfCompany = async (req, res) =>{

    try {

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access forbidden: only admins can veiw list of companies present.' });
        }

        const companies = await Company.find(); 
        console.log("hellooo");
        res.status(200).json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }

}


  
  
  
  
  
  
  


