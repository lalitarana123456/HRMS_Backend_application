//importing required modules
const Employee = require('../models/employeeModel');
const {exportToExcel} = require('../utils/excelExporter'); //excel utility
const upload = require('../middleware/multerMiddleware');
const mongoose = require('mongoose');


exports.createLeaveRequest = [upload.array('documents', 5), async (req, res) => {
    //-----testing purpose
    // console.log(req.body);
    // console.log(req.document)

    try {
        const { leaveType, startDate, endDate, description } = req.body;
        const { _id: employeeId, name: employeeName } = req.user;

        //extracting document
        const documents = req.files ? req.files.map(file => file.path) : [];

        // Validate required fields
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start Date and End Date are required.' });
        }

        //Validate leaveType
        const validLeaveTypes = ['Maternity Leave', 'Sick Leave', 'Emergency Leave', 'Personal Leave', 'Menstrual Leave', 'Bereavement Leave'];
        if (!validLeaveTypes.includes(leaveType)) {
            console.error('Invalid leaveType:', leaveType);
            return res.status(400).json({ error: `'${leaveType}' is not a valid leave type.` });
        }

        //checking if endDtate is before startDate
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ error: 'End Date cannot be earlier than Start Date.' });
        }

        //Allowing leave for current or future dates
        const today = new Date().setHours(0, 0, 0, 0);
        if (new Date(startDate).setHours(0,0,0,0) < today) {
            return res.status(400).json({ error: 'Leave can only be applied for current and future dates.' });
        }

        // Fetch logged-in employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        //Preventing multiple leave request for overlapping dates
        const isConflict = employee.leaves.some((leave) => {
            const existingStartDate = new Date(leave.startDate).setHours(0,0,0,0);
            const existingEndDate = new Date(leave.endDate).setHours(0,0,0,0);
            const requestedStartDate = new Date(startDate).setHours(0,0,0,0);
            const requestedEndDate = new Date(endDate).setHours(0,0,0,0);


            //cheking if the new leave overlapping with the existing leave 
            return (
                (requestedStartDate >= existingStartDate && requestedStartDate <= existingEndDate) ||
                (requestedEndDate >= existingStartDate && requestedEndDate <= existingEndDate) ||
                (requestedStartDate <= existingStartDate && requestedEndDate >= existingEndDate)
            );
        });

        if (isConflict){
            return res.status(400).json({error: 'A leave request already exists for selected datees.'});
        }

        //detremining paid/unpaid based on the leavtype
        const paidLeaves = ['Sick Leave', 'Menstrual Leave', 'Maternity Leave', 'Bereavement Leave'];
        const paidOrUnpaidType = paidLeaves.includes(leaveType) ? 'Paid' : 'Unpaid';

        if (paidOrUnpaidType === 'Paid' && employee.leaveBalance <= 0) {
            return res.status(400).json({ error: 'Insufficient leave balance. Paid leave cannot be applied.' });
        }

        // Create leave request
        const leaveRequest = {
            employeeName,
            leaveType,
            startDate,
            endDate,
            paidOrUnpaidType,
            description: description || '',
            documents,
            status: 'Pending',
        };


        employee.leaves.push(leaveRequest);
        await employee.save();

        res.status(201).json({ message: 'Leave request created successfully', data: leaveRequest });
    } catch (error) {
        console.error('Validatiion error:', error.message);
        res.status(500).json({ error: error.message });
    }
}];


//API to get all leave request 
exports.getEmployeeLeaves = async (req, res) =>{
    try{

        const {_id: employeeId } = req.user;

        //fetching employee leaves 
        const employee = await Employee.findById(employeeId);
        if(!employee){
            return res.status(404).json({error: 'Employee not found'});
        }

        //formate the leave dates
        const formattedLeaves = employee.leaves.map((leave) =>({
            employeeName: leave.employeeName,
            leaveType: leave.leaveType,
            startDate: new Date(leave.startDate).toLocaleDateString('en-us',{
                month: 'short',
                day: 'numeric',
                year:'numeric',
            }),
            endDate: new Date(leave.endDate).toLocaleDateString('en-us',{
                month: 'short',
                day: 'numeric',
                year:'numeric',
            }),

            status: leave.status,
            leaveBalance: leave.leaveBalance,
            description: leave.description.at,
            _id: leave._id,
            paidOrUnpaidType:leave.paidOrUnpaidType,
            leaveHistory: leave.leaveHistory,
            createdAt: leave.createdAt,
        }));

        res.status(200).json({leaves :formattedLeaves});
        
    }catch(error){
        
        res.status(500).json({error: error.message});
    }
};


//Admin can deny or approved leave request
exports.approveOrDenyLeaveRequest = async (req, res) =>{

    try{
        
        //leaveId from the request param
        const { id } = req.params;
        //status from the request body
        const { status, rejectionReason } = req.body;

        //check if the logged-in user is an admin 
        if(req.user.role !== 'Admin' && req.user.role !== 'Employer'){
            return res.status(403).json({message: 'Access forbidden: only admins can perform this action.'});
        }

        //validate the status
        if(!['Approved', 'Rejected'].includes(status)){
            return res.status(400).json({error: 'invalid status provided.'});
        }

        // if rejecting, rejectionReason is required
        if (status === 'Rejected' && !rejectionReason) {
            return res.status(400).json({ error: 'Rejection reason is required.' });
        }

        //finding the leave request by id
        const employee = await Employee.findOne({
            'leaves._id': id,
        });

        if(!employee){
            return res.status(404).json({error: 'Leave request not found.'});
        }

        //checking for the specific leave request
        const leaveRequest = employee.leaves.id(id);

        //Ensure leave request is still pending
        if(leaveRequest.status !== 'Pending'){
            return res.status(400).json({message: 'Only pending leave request can be approved or rejected.'});
        }

        //calculating number of leave days
        const leaveDays = Math.ceil((new Date(leaveRequest.endDate) - new Date(leaveRequest.startDate))/(1000 * 60 * 60 * 24))+ 1;

        //ensuring sufficient leave balance
        if(status === 'Approved' && leaveRequest.paidOrUnpaidType === 'Paid'){

            if(employee.leaveBalance < leaveDays){
                return res.status(400).json({message:' Insufficient leave balance to approve the request'});

            }

            employee.leaveBalance -= leaveDays;
        }

        
        // updating leave request
        leaveRequest.status = status;
        if (status === 'Rejected') {
            leaveRequest.rejectionReason = rejectionReason; // Save rejection reason
        }
        
        //saving the updated employee document 
        await employee.save();

        //responding with the updated leave request 
        res.status(200).json({
            message: `Leave request ${status.toLowerCase()} successfully`,
            data: leaveRequest,
            leaveBalance: employee.leaveBalance,
        });


        
    }catch(error){
        console.error('Error approving/rejection in leave request:', error.message);
        res.status(500).json({error: error.message});
    }
}

//Modify an existing leave request for logged-in employee
//I have not validated for the existing date of leave request 
exports.modifyLeaveRequest = [upload.array('documents', 5), async (req, res) =>{


    try {
        const { leaveId } = req.query;
        const { leaveType, startDate, endDate, paidOrUnpaidType } = req.body;

        if (!leaveId) {
            return res.status(400).json({ error: "Leave Id is required." });
        }

        // Validate endDate
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ error: 'End Date cannot be earlier than Start Date.' });
        }

        // Allowing leave for current or future dates
        const today = new Date().setHours(0, 0, 0, 0);
        if (new Date(startDate).setHours(0, 0, 0, 0) < today) {
            return res.status(400).json({ error: 'Leave can only be applied for current and future dates.' });
        }

        // Finding the logged-in employee
        const employee = await Employee.findById(req.user._id);
        if (!employee) {
            return res.status(400).json({ error: 'Employee not found.' });
        }

        // Finding the specific leave request
        const leave = employee.leaves.find(l => l._id.toString() === leaveId);
        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        const paidLeaves = ['Sick Leave', 'Menstrual Leave', 'Maternity Leave', 'Bereavement Leave'];
        const wasPaidLeave = leave.paidOrUnpaidType === "Paid";
        const isUpdatedLeavePaid = paidOrUnpaidType === "Paid";

        // **Refund previous balance if leave was approved and paid**
        if (leave.status === "Approved" && wasPaidLeave) {
            const oldLeaveDays = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            employee.leaveBalance += oldLeaveDays; // Refund previous deduction
        }

         //Preventing multiple leave request for overlapping dates
         const isConflict = employee.leaves.some((leave) => {
            const existingStartDate = new Date(leave.startDate).setHours(0,0,0,0);
            const existingEndDate = new Date(leave.endDate).setHours(0,0,0,0);
            const requestedStartDate = new Date(startDate).setHours(0,0,0,0);
            const requestedEndDate = new Date(endDate).setHours(0,0,0,0);


            //cheking if the new leave overlapping with the existing leave 
            return (
                (requestedStartDate >= existingStartDate && requestedStartDate <= existingEndDate) ||
                (requestedEndDate >= existingStartDate && requestedEndDate <= existingEndDate) ||
                (requestedStartDate <= existingStartDate && requestedEndDate >= existingEndDate)
            );
        });

        if (isConflict){
            return res.status(400).json({error: 'A leave request already exists for selected datees.'});
        }

        // **Recalculate new leave deduction if the updated leave is paid**
        let newLeaveDays = Math.ceil((new Date(endDate || leave.endDate) - new Date(startDate || leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        
        if (isUpdatedLeavePaid) {
            if (newLeaveDays > employee.leaveBalance) {
                return res.status(400).json({ error: 'Insufficient leave balance for modification.' });
            }
            employee.leaveBalance -= newLeaveDays; // Deduct new leave days if updated as paid
        }

        // **Replace existing documents instead of appending**
        leave.document = req.files.length > 0 ? req.files.map(file => file.path) : leave.document;

        // Updating leave details
        leave.leaveType = leaveType || leave.leaveType;
        leave.startDate = startDate || leave.startDate;
        leave.endDate = endDate || leave.endDate;
        leave.paidOrUnpaidType = paidOrUnpaidType || leave.paidOrUnpaidType;
        leave.status = 'Pending'; // Reset status after modification

        // Saving the updated employee document
        await employee.save();

        res.status(200).json({
            message: 'Leave request modified successfully.',
            updatedLeave: leave,
            leaveBalance: employee.leaveBalance
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}];


//cancel leave Request if status is pending
exports.cancelLeaveRequest = async (req, res) =>{

    try{

        //Extrating leaveId from the query paramenter
        const {leaveId} = req.query;
        //console.log('leaveId is:', leaveId);

        if(!leaveId){
            return res.status(400).json({error : 'Leave Id is required.'});
        }
    
        //finding the logged-in employee
        const employee = await Employee.findById(req.user._id);
        //console.log(employee);
        if(!employee){
            res.status(404).json({error: 'Employee is not found.'});
        }
    
        //finding the specific leave request by leaveId
        const leave = employee.leaves.find(l => l._id.toString() === leaveId);
        //console.log('Leave is: ',leave);
        if(!leave){
            return res.status(404).json({error: "Leave request not found."});
        }
    
        //checking if the leave is still pending
        // if(leave.status !== 'Pending'){
        //     return res.status(400).json({error: "Only pending leave requests can be cancelled."});
        // }
    
        //Removing the leave request 
        employee.leaves.pull({_id : leaveId });

        //saving the employee document after removing the leave
        await employee.save();

        res.status(200).json({message: 'Leave request cancelled successfully', leaveId});


    }catch(error){
        res.status(500).json({error: error.message});
    }
}

//get leaveBalance of employee
exports.getLeaveBalance = async (req, res) => {
    try {
        // extractinfg loggedin employee's leave balance
        const employee = await Employee.findById(req.user._id).select('leaveBalance');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // console leave balance for debugging
        console.log(`Employee ID: ${req.user._id}, Leave Balance: ${employee.leaveBalance}`);

        // resp[ose] the latest leave balance in the response
        res.status(200).json({ leaveBalance: employee.leaveBalance });
    } catch (error) {
        console.error('Error while fetching leave balance:', error.message);
        res.status(500).json({
            message: 'Failed to fetch leave balance.',
            error: error.message,
        });
    }
};

//get leave details in case of rejecting leave
exports.getLeaveRequestDetails = async (req, res) => {
    try {
        const { leaveId } = req.params;

        // finding the employee who owns this leave request
        const employee = await Employee.findOne({
            _id: req.user.id, //  employee can only see their own leave request
            'leaves._id': leaveId,
        });

        if (!employee) {
            return res.status(404).json({ error: "Leave request not found or unauthorized access." });
        }

        // extracting leave request details
        const leaveRequest = employee.leaves.id(leaveId);

        const formattedStartDate = new Date(leaveRequest.startDate).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        
        const formattedEndDate = new Date(leaveRequest.endDate).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        // response as per the requirement with leave request details
        res.status(200).json({
            name: employee.fullName,
            designation: employee.designation,
            leaveType: leaveRequest.leaveType,
            days: Math.ceil((new Date(leaveRequest.endDate) - new Date(leaveRequest.startDate)) / (1000 * 60 * 60 * 24)) + 1,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            files:employee.documents,
            leaveDescription: leaveRequest.description || 'No description provided',
            status: leaveRequest.status,
            profilePhoto: employee.profilePhoto,
            rejectionReason: leaveRequest.status === 'Rejected' ? leaveRequest.rejectionReason : null,
        });

    } catch (error) {
        console.error('Error fetching leave request details:', error.message);
        res.status(500).json({ error: error.message });
    }
};


exports.getSalaryAndDeductionOfEmployee = async (req, res) =>{
    try {
        // Get logged-in employee ID from JWT
        const employeeId = req.user.id; 

        // Fetch employee details from DB
        const employee = await Employee.findById(employeeId).select('salary salaryDeduction');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            salary: employee.salary,
            salaryDeduction: employee.salaryDeduction
        });

    } catch (error) {
        console.error('Error fetching salary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



//Exporting leave data to Excel
exports.exportLeaveData = async (req, res) =>{

    try{


        //fetching all leave request
        const leaveRequests = await Leave.find();


        //Exporting data to excel
        const excelBuffer = await exportToExcel(leaveRequests);

        //sending excel file as a response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=leave_data.xlsx');
        res.send(excelBuffer);


    }catch(error){

        res.status(500).json({error: error.message});
    }
};
