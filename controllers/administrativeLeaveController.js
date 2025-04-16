const Employee = require('../models/employeeModel');
const path = require('path');
const fs = require('fs');



exports.getAllPendingLeaveEmployees = async (req, res) =>{
    try {

        const { role, companyId } = req.user;

        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        let filter = { "leaves.status": "Pending" }; // Keep the pending filter
        
        if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId; // Apply company filter for employer
        }
        


        const employees = await Employee.find(filter)
            .select("fullName profilePhoto employeeId department leaves designation");

        if (!employees.length) {
            return res.status(404).json({ message: "No employees with pending leave requests." });
        }

        // giving the response as per UI
        const formattedResponse = employees.map(emp => {
            return emp.leaves
                .filter(leave => leave.status === "Pending") // Only pending leaves
                .map(leave => ({
                      // Full name instead of first + last
                    fullName: emp.fullName,
                    profilePhoto: emp.profilePhoto, // Add profile photo
                    employeeId: emp.employeeId,
                    leaveObjectId: leave._id,
                    employeeObjectId:emp._id,
                    leaveType: leave.leaveType,
                    noOfDays: Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1,
                    department: emp.department,
                    designation:emp.designation,
                    
                }));
        }).flat();

        res.status(200).json(formattedResponse);
    } catch (error) {
        console.error("Error fetching pending leaves:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getLeaveRequestDetailsForAdminEmployer = async (req, res) => {
    try {
        const { leaveId } = req.params;

        // Check if the logged-in user is Admin or Employer
        if (req.user.role !== "Admin" && req.user.role !== "Employer") {
            return res.status(403).json({ error: "Access denied. Only Admin and Employer can access this data." });
        }

        // Find the employee who has this leave request
        const employee = await Employee.findOne({ "leaves._id": leaveId });

        if (!employee) {
            return res.status(404).json({ error: "Leave request not found." });
        }

        // Extract leave request details
        const leaveRequest = employee.leaves.id(leaveId);

        const formattedStartDate = new Date(leaveRequest.startDate).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });

        const formattedEndDate = new Date(leaveRequest.endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });

        // Response with profile photo and leave details
        res.status(200).json({
            name: employee.fullName,
            employeeId:employee._id,
            designation: employee.designation,
            profilePhoto: employee.profilePhoto || "No photo uploaded",
            leaveType: leaveRequest.leaveType,
            days:
                Math.ceil(
                    (new Date(leaveRequest.endDate) - new Date(leaveRequest.startDate)) /
                        (1000 * 60 * 60 * 24)
                ) + 1,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            leaveOjectId:leaveId, 
            files: leaveRequest.documents || [],
            leaveDescription: leaveRequest.description || "No description provided",
            status: leaveRequest.status,
            rejectionReason: leaveRequest.status === "Rejected" ? leaveRequest.rejectionReason : null,
        });
    } catch (error) {
        console.error("Error fetching leave request details:", error.message);
        res.status(500).json({ error: error.message });
    }
};


exports.getEmployeeProfile = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Fetch employee details using employeeId
        const employee = await Employee.findOne({ employeeId });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found." });
        }

        // Extract necessary details
        const profileDetails = {
            name: employee.fullName,
            designation: employee.designation,
            department: employee.department,
            profileImage: employee.profilePhoto || "No profile image uploaded",
            employeeId: employee.employeeId,
        };

        res.status(200).json(profileDetails);
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.downloadLeaveDocument = async (req, res) => {
    try {

        console.log("Params:", req.params);  // Debugging

        const leaveIdx = req.params.leaveIndex;  // This is an ObjectId (string)
        const fileIdx = parseInt(req.params.fileIndex, 10);

         // Validate fileIdx
         if (isNaN(fileIdx) || fileIdx < 0) {
            return res.status(400).json({ error: "Invalid file index." });
        } 
console.log(leaveIdx)
console.log(fileIdx)

        // Fetch employee
        const employee = await Employee.findById(req.params.employeeId);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found." });
        }

            // Find the leave entry by its ObjectId
            const leave = employee.leaves.find(leave => leave._id.toString() === leaveIdx);
            if (!leave) {
                return res.status(404).json({ error: "Leave request not found." });
            }

 
            const filePath = leave.documents[fileIdx]; // File name from DB or request
            const uploadDir = path.resolve(__dirname, "../uploads"); // Uploaded files directory
            const leavesDir = path.resolve(__dirname, "../uploads/leaves"); // Downloaded files directory
            
            // Ensure "uploads/leaves" folder exists
            if (!fs.existsSync(leavesDir)) {
                fs.mkdirSync(leavesDir, { recursive: true });
            }
            
            const sourcePath = path.join(uploadDir, path.basename(filePath));
            
            // Check if file exists in "uploads/"
            if (!fs.existsSync(sourcePath)) {
                console.error("File does not exist at:", sourcePath);
                return res.status(404).json({ error: "File not found in 'uploads/' folder." });
            }
            
            // Generate a unique file name for "uploads/leaves/"
            const fileExtension = path.extname(filePath);
            const fileNameWithoutExt = path.basename(filePath, fileExtension);
            const timestamp = Date.now();
            const newFileName = `${fileNameWithoutExt}-${timestamp}${fileExtension}`;
            const destinationPath = path.join(leavesDir, newFileName);
            
            console.log("Source file path:", sourcePath);
            console.log("Destination file path:", destinationPath);
            
            // Copy the file to "uploads/leaves/" before downloading
            fs.copyFile(sourcePath, destinationPath, (err) => {
                if (err) {
                    console.error("Error copying file:", err);
                    return res.status(500).json({ error: "Failed to copy file to 'uploads/leaves/'." });
                }
            
                // Send the file to the client
                res.download(sourcePath, path.basename(sourcePath), (err) => {
                    if (err) {
                        console.error("File download error:", err);
                        res.status(500).json({ error: "Failed to download file." });
                    }
                });
            });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};