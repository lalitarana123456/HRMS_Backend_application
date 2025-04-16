const express = require('express');
const router = express.Router();
const { protect, roleAccess } = require('../middleware/authMiddleware');



const adminController = require('../controllers/adminController');


//List of comapny
router.get('/listOfCompany', protect, adminController.listOfCompany);

//get a particular employee by id
router.get('/:id', protect, adminController.getEmployeeById);

//Get All Employee
router.get('/' , protect, adminController.getAllEmployees);

//Edit Employee
router.put('/edit/:id', protect, adminController.editEmployee);



module.exports = router;







/*
    testing purpose
    ------------------
    1 - Add employee
    http://localhost:8900/employees/add

    {
        "name":"karan",
        "email":"karan432@gmail.com",
        "position":"developer",
        "photo":""
    }

    {
    "message": "Employee added successfully",
    "employee": {
        "name": "karan",
        "email": "karan432@gmail.com",
        "position": "developer",
        "photo": null,
        "_id": "6752a9de6db2cef9b8bdda3b",
        "createdAt": "2024-12-06T07:38:06.237Z",
        "updatedAt": "2024-12-06T07:38:06.237Z",
        "__v": 0
    }
}
    2 - Get All Employee
    http://localhost:8900/employees
    {
    "employees": [
        {
            "_id": "6751c8d60944f74681cf3163",
            "name": "Arti",
            "email": "arti432@gmail.com",
            "position": "Teacher",
            "photo": null,
            "createdAt": "2024-12-05T15:37:58.345Z",
            "updatedAt": "2024-12-05T15:37:58.345Z",
            "__v": 0
        },
        {
            "_id": "6751c9500944f74681cf3165",
            "name": "Kirti",
            "email": "kirti432@gmail.com",
            "position": "Admin",
            "photo": null,
            "createdAt": "2024-12-05T15:40:00.352Z",
            "updatedAt": "2024-12-05T15:40:00.352Z",
            "__v": 0
        },
        {
            "_id": "6751c96f0944f74681cf3167",
            "name": "Rudra",
            "email": "rudra432@gmail.com",
            "position": "teacher",
            "photo": null,
            "createdAt": "2024-12-05T15:40:31.354Z",
            "updatedAt": "2024-12-05T15:40:31.354Z",
            "__v": 0
        },
        {
            "_id": "6751c9cd0944f74681cf3169",
            "name": "Om",
            "email": "om432@gmail.com",
            "position": "teacher",
            "photo": null,
            "createdAt": "2024-12-05T15:42:05.571Z",
            "updatedAt": "2024-12-05T15:42:05.571Z",
            "__v": 0
        },
        {
            "_id": "6752a9de6db2cef9b8bdda3b",
            "name": "karan",
            "email": "karan432@gmail.com",
            "position": "developer",
            "photo": null,
            "createdAt": "2024-12-06T07:38:06.237Z",
            "updatedAt": "2024-12-06T07:38:06.237Z",
            "__v": 0
        }
    ]
}
    3 - Delete Employee
    router.delete('/:id', deleteEmployee);
    http://localhost:8900/employees/6751c8d60944f74681cf3163
    {
       "message": "Employee not found"
    }
       
    
    4 - Update Employee
    http://localhost:8900/employees/6751c96f0944f74681cf3167
    {
        "name":"Rudra",
        "email":"rudra000@gmail.com",
        "position":"developer",
        "photo":""
    }


    {
    "message": "Employee updated successfully",
    "employee": {
        "_id": "6751c96f0944f74681cf3167",
        "name": "Rudra",
        "email": "rudra000@gmail.com",
        "position": "developer",
        "photo": null,
        "createdAt": "2024-12-05T15:40:31.354Z",
        "updatedAt": "2024-12-06T07:46:20.944Z",
        "__v": 0
    }
}

*/