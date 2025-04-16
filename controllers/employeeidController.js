const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');

//---------------------------------------------------//
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
//---------------------------------------------------//

//const upload = require('../middleware/multerMiddleware');
const nodemailer = require('nodemailer'); // Import nodemailer
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure environment variables are loaded

//AWS S3 Configuration
//const s3 = new S3Client({
   // region: process.env.AWS_REGION,
    //credentials: {
      //  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
       // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
   // }
//});

// Multer S3 setup
//const upload = multer({
  //  storage: multerS3({
      //  s3: s3,
       // bucket: process.env.S3_BUCKET_NAME,
        //metadata: (req, file, cb) => {
          //  cb(null, { fieldName: file.fieldname });
       // },
       // key: (req, file, cb) => {
          //  const fileName = `employee-profile/${Date.now()}-${file.originalname}`;
          //  cb(null, fileName);
       // }
  //  })
//});

// Nodemailer Transporter for Hostinger
const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
    }
});

exports.createEmployee = [ async (req, res) => {
    //console.log("Requested body:", req.body);
    //console.log("Uploaded file:", req.file);

    try {
        const {
            firstName,
            lastName,
            email,
            password,
            dateOfJoining,
            gender,
            contactNumber,
            designation,
            department,
            teamLeader,
            leaveBalance,
            employeeStatus,
            averageWorkingHours,
            salary,
            status,
        } = req.body;

        if (!firstName || !lastName || !email || !password || !gender) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Assigning default profile photos based on gender if no file uploaded
        const maleProfilePhoto = `https://avatar.iran.liara.run/public/boy?email=${email}`;
        const femaleProfilePhoto = `https://avatar.iran.liara.run/public/girl?email=${email}`;
        const profilePhoto = req.file
            ? `/uploads/${req.file.filename}`
            : gender === "Male"
                ? maleProfilePhoto
                : femaleProfilePhoto;

        // Parsing the dateOfJoining from DD-MM-YYYY to a valid Date object
        // const [day, month, year] = dateOfJoining.split('-');
        // const parsedDate = new Date(`${year}-${month}-${day}`);

        // if (isNaN(parsedDate)) {
        //     return res.status(400).json({ message: 'Invalid date format. Please use DD-MM-YYYY.' });
        // }

        // Generating a unique 4-digit numeric employee ID
        let employeeId;
        let isUnique = false;

        while (!isUnique) {
            employeeId = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
            const existingEmployee = await Employee.findOne({ employeeId });
            if (!existingEmployee) {
                isUnique = true;
            }
        }

        //Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);

        //Determining if the user is admin or employer
        const isAdmin = req.user.role === 'Admin'; // Assuming req.user contains role
        const companyId = isAdmin ? null : req.user.companyId;

        if (!isAdmin && !companyId) {
            return res.status(403).json({ message: 'Employer must have a companyId.' });
        }

        // Create the employee
        const employee = new Employee({
            firstName,
            lastName,
            email,
            employeeId,
            password: hashedPassword,
            dateOfJoining,
            gender,
            contactNumber,
            designation,
            department,
            teamLeader,
            leaveBalance,
            employeeStatus,
            averageWorkingHours,
            salary,
            profilePhoto: profilePhoto,
            companyId,
            status,
            averageWorkingHours
        });

        await employee.save();

        // Send Email with Credentials
        const mailOptions = {
            from: process.env.HOSTINGER_EMAIL,
            to: email,
            subject: "Welcome to the Assigner - Your Credentials",
            html: `
                <p>Hello ${firstName} ${lastName},</p>
                <p>Welcome to the company! Below are your login credentials:</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p>Please log in and update your password for security reasons.</p>
                <br>
                <p>Best Regards,</p>
                <p>HR Team</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(201).json({ message: 'Employee created successfully. Email sent.', employee });

    } catch (error) {
        console.error('Error while creating employee:', error.message);
        res.status(500).json({ message: error.message });
    }
}];


exports.getProfile = async (req, res) => {
    try {
        // extracting employee id from JWT token
        const {employeeId} = req.params; 
        
        //console.log(employeeId);

        if (!employeeId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Employee ID is missing." });
        }

        // fetching the login employee
        const employeeProfile = await Employee.findOne({ employeeId })
            .select("fullName designation employeeId email dateOfJoining employeeStatus contactNumber profilePhoto dateOfBirth gender alternativeNumber address teamLeader ") // selecting only required fields
            .lean();


        if (!employeeProfile) {
            return res.status(404).json({ success: false, message: "Employee profile not found." });
        }

        // formatting date fields
        if (employeeProfile.dateOfJoining) {
            employeeProfile.dateOfJoining = employeeProfile.dateOfJoining.toISOString().split("T")[0];
        }
        if (employeeProfile.dateOfBirth) {
            employeeProfile.dateOfBirth = employeeProfile.dateOfBirth.toISOString().split("T")[0];
        }

        res.status(200).json({ success: true, employee: employeeProfile });

    } catch (error) {
        console.error("Error fetching employee profile:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
    

// AWS S3 Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer S3 setup (Define upload before using it)
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `employee-profile/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        }
    })
});

// Ensure upload is defined before using it
exports.editEmployee = [
    upload.single('profilePhoto'), // Middleware for file upload
    async (req, res) => {
        try {
            const employeeId = req.user._id;

            // Find the employee by ID
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found.' });
            }

            // Extracting fields from request body
            const { contactNumber, alternativeNumber, dateOfBirth, address, email, gender,profilePhoto } = req.body;

            // Updating fields only if provided
            if (contactNumber) employee.contactNumber = contactNumber;
            if (alternativeNumber) employee.alternativeNumber = alternativeNumber;
            if (address) {
                if (address.city) employee.address.city = address.city;
                if (address.postalCode) employee.address.postalCode = address.postalCode;
                if (address.completeAddress) employee.address.completeAddress = address.completeAddress;
            }
            if (dateOfBirth) employee.dateOfBirth = dateOfBirth;
            if (email) employee.email = email;
            if ( profilePhoto) employee.profilePhoto = profilePhoto;

            // Handling profile photo upload
            if (req.file) {
                employee.profilePhoto = req.file.location; // S3 URL
            } else if (!employee.profilePhoto) {
                employee.profilePhoto = `https://avatar.iran.liara.run/public/${gender.toLowerCase()}?email=${email}`;
            }

            // Save updated employee details
            await employee.save();

            res.status(200).json({
                message: 'Employee updated successfully',
                employee,
            });
        } catch (error) {
            console.error('Error while editing employee:', error.message);
            res.status(500).json({ message: error.message });
        }
    }
];




