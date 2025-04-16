
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3'); // Import S3 configuration

// Define allowed file types for profile images
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Create a storage configuration for multer to upload files to S3
const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME, // Ensure this environment variable is set
      acl: 'public-read', // Set file access to public-read
      key: function (req, file, cb) {
        // Store profile images under "profile-images" folder with a unique name
        cb(null, `profile-images/${Date.now()}_${file.originalname}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: function (req, file, cb) {
      // Check if the file type is allowed
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPG, PNG, PDF, and DOCX are allowed.'));
      }
    },
  }).single('profileImage'); // Field name is 'profileImage' now
  
  module.exports = upload;
  


