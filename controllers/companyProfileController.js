const CompanyAdmin = require('../models/adminCreateCompanyIdModel');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer S3 setup
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `company-logos/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

// Update Company API
exports.updateCompany = [upload.single('logo'), async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!userRole || (userRole !== "Admin" && userRole !== "Employer")) {
      return res.status(403).json({ error: "Access denied. Only Admin or Employer can update company details." });
    }

    const userEmail = req.user.email;
    const { Name, ownerName, domainEmail, personalEmail, industryType, description, address, sectorName, phoneNumber, establishedOn } = req.body;

    const existingCompanyAdmin = await CompanyAdmin.findOne({ email: userEmail });
    if (!existingCompanyAdmin) {
      return res.status(404).json({ success: false, message: "Company not found for the logged-in user." });
    }

    if (Name) existingCompanyAdmin.Name = Name;
    if (ownerName) existingCompanyAdmin.ownerName = ownerName;
    if (domainEmail) existingCompanyAdmin.domainEmail = domainEmail;
    if (personalEmail) existingCompanyAdmin.personalEmail = personalEmail;
    if (industryType) existingCompanyAdmin.industryType = industryType;
    if (description) existingCompanyAdmin.description = description;
    if (address) existingCompanyAdmin.address = address;
    //if (sectorName) existingCompanyAdmin.sectorName = sectorName;
    if (phoneNumber) existingCompanyAdmin.phoneNumber = phoneNumber;
    if (establishedOn) existingCompanyAdmin.establishedOn = establishedOn;
   

    if (req.file) {
      existingCompanyAdmin.logo = req.file.location; // Storing the S3 URL in the database
    }

    await existingCompanyAdmin.save();

    res.status(200).json({ 
      success: true, 
      message: "Company updated successfully.", 
      updatedCompany: existingCompanyAdmin 
    });

  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}];

exports.getCompanyProfileDetails = async (req, res) => {
   
  //just get the conmpanny profile
  try{

    const userRole = req.user?.role;
    if (!userRole || (userRole !== "Admin" && userRole !== "Employer")) {
      return res.status(403).json({ error: "Access denied. Only Admin or Employer can update company details." });
    }

    const userEmail = req.user.email;

    const existingCompanyAdmin = await CompanyAdmin.findOne({ email: userEmail });
    if (!existingCompanyAdmin) {
      return res.status(404).json({ success: false, message: "Company not found for the logged-in user." });
    }

    res.status(201).json({message:`${existingCompanyAdmin.Name} profile`, existingCompanyAdmin});

  }catch(error){
    console.error("Error getting company profile:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}