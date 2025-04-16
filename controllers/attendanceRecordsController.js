const AttendanceHistory = require("../models/attendanceRecordsModel");
const Employee = require("../models/employeeModel");
const express = require("express");
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("path");
const moment = require("moment");

//formatting timeSpent into hrs and minutes
const formatHoursAndMinutes = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return "0 hrs";

    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${hours} hrs ${minutes} min`;
};

//here formatting time in HH:MM AM/PM
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

//getting all records of attendance of all employee, default it will be current day
const getAttendanceRecords = async (req, res) => {
    try {
        //extracting user role and comp id from the request
        const { role, companyId } = req.user;

        //restricting access, only admin and employer allowed
        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        //filter as per the loggedin user 
        let filter = {};
        if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        } else if(role === 'Admin') {
            filter.companyId = null;
        }

        //extracting date filters, from request which is optional
        const { day, month, year } = req.query;
        //console.log("dAY getting for filteration", day);
        
        

        //initializing filterdate to the current dfate, bcs by default it is current day only
        let filterDate = new Date();
        //console.log("filterdate getting:", filterDate)

        // now applying year, month, and day
        if (year) filterDate.setFullYear(year);
        if (month) filterDate.setMonth(month - 1);//as in js month is 0 based so -1 
        if (day) filterDate.setDate(day);

        //as mongo storing utc so, normalising to that type only
        filterDate.setUTCHours(0, 0, 0, 0);
        //console.log("filterdate getting after setting to current local time date zone:", filterDate);//here I nedt o tfix

        //converting to YYYY-MM-DD ensuring it's interpreted for same comparison
        const filterDateString = filterDate.toISOString().split("T")[0]; // 'YYYY-MM-DD' format

        //console.log("foirmatted date getting:", filterDateString)

        //fetching all emplopyees from the db
        const employees = await Employee.find(filter);

        //mapping through all employee to create attendance records
        let attendanceRecords = employees.map(employee => {
            
            //finding atten record fot the given date
            const attendance = employee.attendance.find(record => {
                //converting att date to date object
                const recordDate = new Date(record.date);
                recordDate.setUTCHours(0, 0, 0, 0); //normalize to midnight
            
                //comp attendance record with filtered date
                return recordDate.toISOString().split("T")[0] === filterDateString;
            });

            //console.log("attendance Getting.", attendance);
            
            //now if att record exists formatting the details
            if (attendance) {

                //conv check in, out timestamp to date obj for comparison
                let checkIn = attendance.firstCheckIn ? new Date(attendance.firstCheckIn) : null;
                let checkOut = attendance.timerStop ? new Date(attendance.timerStop) : null;

                //using timeSpent directly which is already in seconds
                let totalWorkingHours = formatHoursAndMinutes(attendance.timeSpent);

                //seeting status as per the check-in checkout
                let status;
                if (checkIn) {
                    if (!checkOut) {
                         checkOut = "Pending";
                        // totalWorkingHours = "0 hrs";
                        // status = "Present";  
                        status = attendance.timeSpent >= 28800 ? "Pending checkout" : "Present";
                    } else {
                         checkOut = formatTime(checkOut);
                        // status = attendance.timeSpent >= 28800 ? "Pending checkout" : "Present"; // 8 hrs = 28800 sec
                        status = "Present";
                    }
                } else {
                    // checkOut = null;
                    // totalWorkingHours = "0 hrs";
                    status = "Absent";
                }

                //returning required details attendance records
                return {
                    employeeId: employee.employeeId,
                    objectId: employee._id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    profilePhoto: employee.profilePhoto,
                    designation: employee.designation,
                    date: filterDateString,
                    checkIn: checkIn ? formatTime(checkIn) : null,
                    checkOut,
                    totalWorkingHours,
                    status,
                };
            } else {
                //if no records, returning default records 
                return {
                    employeeId: employee.employeeId,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    objectId: employee._id,
                    profilePhoto: employee.profilePhoto,
                    designation: employee.designation,
                    // date: new Date(filterDate.getTime() - filterDate.getTimezoneOffset() * 60000)
                    // .toISOString()
                    // .split("T")[0],//in response always taking one day before, so here we filtered date
                    date:filterDateString,
                    checkIn: null,
                    checkOut: null,
                    totalWorkingHours: "0 hrs",
                    status: "Absent",
                };
            }
        });

        //sending attendance records
        res.status(200).json({ success: true, attendanceRecords });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const updateAttendance = async (req, res) => {
  try {
    const { role, companyId } = req.user;

        //check role-based access control
        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

    
        //validate request body only checkOut should be updated
        const { employeeId, date, checkOut } = req.body;
        if (!employeeId || !date || !checkOut) {
            return res.status(400).json({ message: "Employee ID, Date, and Check-Out time are required." });
        }

        // validating and formating date
        const formattedDate = moment(date, "YYYY-MM-DD", true);
        if (!formattedDate.isValid()) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }
        const dateString = formattedDate.format("YYYY-MM-DD");

        // parshing check-out time
        const parseTime = (time) => {
            return moment(`${dateString} ${time}`, "YYYY-MM-DD hh:mm A").toDate();
        };
        const checkOutTime = parseTime(checkOut);

        // finding employee by id
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }


        // searching existing attendance record for the given date
        let attendance = employee.attendance.find(
            (att) => moment(att.date).format('YYYY-MM-DD') === dateString
        );

        if (!attendance) {
            return res.status(404).json({ success: false, message: "No check-in record found for this date." });
        }

        //check-in exists before updating check-out or not
        if (!attendance.firstCheckIn) {
            return res.status(400).json({ message: "Check-in record is missing. Check-out cannot be updated." });
        }

        //updating only check-out time and related fields
        attendance.timerStop = checkOutTime;
        attendance.timeSpent = Math.floor((attendance.timerStop - attendance.firstCheckIn) / 1000);
        attendance.status = "Present";

        //saving updated employee document
        await employee.save();

        // storing in AttendanceHistory
        await AttendanceHistory.create({
            employeeId: employee._id,
            date: attendance.date,
            timerStart: attendance.firstCheckIn,
            timerStop: attendance.timerStop,
            timeSpent: attendance.timeSpent,
            action: "check-out",
        });

        return res.status(200).json({
            success: true,
            message: "Check-out updated successfully.",
            attendance,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};



//exporting attendance record default it is current date, and if filtered we want we can do also
const exportAttendance = async (req, res) => {
  try {
    const { role, companyId } = req.user;

        if (role !== 'Admin' && role !== 'Employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

         //filter as per the loggedin user 
        let filter = {};
        if (role === 'Employer') {
            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required for employers' });
            }
            filter.companyId = companyId;
        } else if(role === 'Admin') {
            filter.companyId = null;
        }

    const { date } = req.query;
    const selectedDate = date
      ? moment(date).format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");

        // fetching all employees, regardless of attendance records
        const employees = await Employee.find(filter);

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found." });
    }

        // processing attendance data
        const formattedData = employees.map((employee) => {
            // Find attendance record for the selected date
            const record = employee.attendance?.find(att => moment(att.date).format("YYYY-MM-DD") === selectedDate);

      return {
        Name: `${employee.firstName} ${employee.lastName}`,
        EmployeeID: employee.employeeId,
        Date: selectedDate,
        // CheckIn: record ? record.firstCheckIn || "NIL" : "NIL",
        // CheckOut: record ? record.timerStop || "NIL" : "NIL",
        CheckIn: record ? formatTime(new Date(record.firstCheckIn)) : "NIL",
        CheckOut: record ? formatTime(new Date(record.timerStop)) : "NIL",
        // WorkingHours: record ? `${record.timeSpent || 0} hrs` : "0 hrs",
        // OnLeave: record ? record.onLeave : false,
        WorkingHours: formattedWorkingHours,
        OnLeave: record ? record.onLeave : false,
        Status: employee.status,
      };
    });

        //creating a workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        //define the file path inside uploads/downloads
        const downloadsDir = path.join(__dirname, "../uploads/downloads");
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

    const filePath = path.join(
      downloadsDir,
      `Attendance_Report_${selectedDate}.xlsx`
    );
    XLSX.writeFile(workbook, filePath);

        //sending file as response
        res.download(filePath, `Attendance_Report_${selectedDate}.xlsx`, (err) => {
            if (err) {
                console.error("File download error:", err);
                res.status(500).json({ message: "Error downloading the file." });
            }
        });

    } catch (error) {
        console.error("Error exporting attendance:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

//endpointys for filter attendance records
const filterAttendanceRecords = async (req, res) => {
  try {
    const { role, companyId } = req.user;
    const { date } = req.query;

    if (role !== "Admin" && role !== "Employer") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let filter = {};
    if (role === "Employer") {
      if (!companyId) {
        return res
          .status(400)
          .json({ message: "Company ID is required for employers" });
      }
      filter.companyId = companyId;
    } else if (role === "Admin") {
      filter.companyId = null;
    }

    // convertiung input date to Date object for filtering
    let filterDate = new Date(Date.parse(date));

    if (isNaN(filterDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const employees = await Employee.find(filter).select(
      "employeeId firstName lastName attendance profilePhoto designation"
    );

    let attendanceRecords = employees.map((employee) => {
      const attendance = employee.attendance.find((record) => {
        return (
          new Date(record.date).toISOString().split("T")[0] ===
          filterDate.toISOString().split("T")[0]
        );
      });

      if (attendance) {
        let checkIn = attendance.firstCheckIn
          ? new Date(attendance.firstCheckIn)
          : null;
        let checkOut = attendance.timerStop
          ? new Date(attendance.timerStop)
          : null;
        let totalWorkingHours = calculateTotalWorkingHours(checkIn, checkOut);

        let status;
        if (checkIn) {
          if (!checkOut) {
            checkOut = "Pending";
            status = "Pending checkout";
            totalWorkingHours = "0 hrs";
          } else {
            checkOut = formatTime(checkOut);
            status = "Present";
          }
        } else {
          checkOut = null;
          totalWorkingHours = "0 hrs";
          status = "Absent";
        }

                return {
                    employeeId: employee.employeeId,
                    objectId: employee._id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    profilePhoto: employee.profilePhoto,
                    designation: employee.designation,
                    date: filterDate.toISOString().split("T")[0],
                    checkIn: checkIn ? formatTime(checkIn) : null,
                    checkOut,
                    totalWorkingHours,
                    status,
                };
            } else {
                return {
                    employeeId: employee.employeeId,
                    objectId: employee._id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    profilePhoto: employee.profilePhoto,
                    designation: employee.designation,
                    date: filterDate.toISOString().split("T")[0],
                    checkIn: null,
                    checkOut: null,
                    totalWorkingHours: "0 hrs",
                    status: "Absent",
                };
            }
        });

    res.status(200).json({ success: true, attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = { getAttendanceRecords, updateAttendance, exportAttendance, filterAttendanceRecords };

