const express = require('express');
const router = express.Router();
const {
    
    updatePassword,
    resetPassword,
    uploadProfilePicture,// not needed now...keeping for future use if required
   

} = require('../controllers/employeeController');
const { protect, roleAccess } = require('../middleware/authMiddleware');


router.put('/password', protect, updatePassword);
router.post('/reset-password', resetPassword);




module.exports = router;
