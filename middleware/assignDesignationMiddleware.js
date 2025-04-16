//Mapping the department to designations
const departmentToDesignationMap = {
    'UI/UX': 'UI/UX Designer',
    'Front-End': 'Front-End Developer',
    'Back-End': 'Back-End Developer',
    'Team Leader':[

        'IT Team Leader',
        'Assignment Team Leader',
        'Finance Team Leader',
        'Digital marketing team Leader',
    ],
    'Research': 'Research Analyst',
    'HR': 'HR Manager',
    'Social Media': 'Social Media Specialist',
    'IT': 'IT Support Specialist',
};

//Middleware function to auto-assign designation
const assignDesignation = function(next){

    if(this.department){
        //assign designation based on the department
        this.designation = departmentToDesignationMap[this.department];

    }
    next();
};

//exporting the middleware
module.exports = assignDesignation;