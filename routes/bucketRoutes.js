const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();  // Initialize multer without any storage options (it will store files in memory)
const { uploadMiddleware, uploadFile } = require('../controllers/bucketController');

// Define POST route to upload profile images
router.post('/profile',  uploadMiddleware, uploadFile);

module.exports = router;



