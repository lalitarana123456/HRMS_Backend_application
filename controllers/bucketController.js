require("dotenv").config();
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const s3 = require("../config/s3");

// Set up Multer for file storage in memory
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, PDF, DOC, DOCX allowed."));
  }
};

// Multer middleware
const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).single("profile-image"); // Changed to 'profile-image'

// Upload file to S3
const uploadFile = async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.file;
    const fileKey = `profile-images/${Date.now()}_${file.originalname}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: fileKey,
      Body: file.buffer,
      //ACL: "public-read",
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error uploading file to S3",
      error: err.message,
    });
  }
};

module.exports = { uploadFile, uploadMiddleware };










  