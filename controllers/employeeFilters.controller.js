const Employee = require("../models/employeeModel");




//------ Sort by Rating 
exports.getSortedEmployees = async (req, res) => {
    try {
        const { order = "desc" } = req.query; // default sortingHigh to Low
        const sortOrder = order === "asc" ? 1 : -1; // [1 = L to H] // [-1 = H to L]

        const employees = await Employee.find().sort({ "yearlyPerformance.overallStarRating": sortOrder }) 
        res.json(employees);
    } catch{
        res.status(500).json({ error: "Something went wrong, Internal server errore" });
    }
};


//----- Filter by Department
exports.getFilteredEmployees = async (req, res) => {
    try {
        const { designation } = req.query;

        //Department diya hai toh filter karega, warna saare employees fetch karega
        const filter = designation ? { designation } : {};

        const employees = await Employee.find(filter);

        res.json(employees);
    } catch{
        res.status(500).json({ error: "Something went wrong, Internal server errore" });
    }
};
 