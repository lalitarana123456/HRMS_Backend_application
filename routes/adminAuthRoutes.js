const express = require('express');
const router = express.Router();

const { registerAdmin, loginAdmin } = require('../controllers/adminAuthController');

//register Admin
router.post('/adminRegister', registerAdmin);

//login Admin
router.post('/adminLogin', loginAdmin);

module.exports = router;