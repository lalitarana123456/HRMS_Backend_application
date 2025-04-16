const roleToSalaryMap = {
    Employee: 30000,
    'Team Leader':40000,
    Manager: 50000,
    Admin: 60000, 
};

//method which will auto assign salary according to tthe role of employee
const assignSalary = function (next){

    //checking if the role is set and corresponding salary exist or not in the map\
    if(this.role && roleToSalaryMap[this.role]){
        //assigning fixed salary based on the role

        this.salary = roleToSalaryMap[this.role];
    }
    next();
};

module.exports = assignSalary;