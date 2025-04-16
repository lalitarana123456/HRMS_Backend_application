const express = require('express');
const router = express.Router();

const {
    getSortedEmployees,
    getFilteredEmployees
    } = require('../controllers/employeeFilters.controller');



router.get('/sortRating', getSortedEmployees );
router.get('/filterDepartment', getFilteredEmployees);


module.exports = router;