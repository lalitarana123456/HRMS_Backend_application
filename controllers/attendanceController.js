
const Employee = require('../models/employeeModel');
const AttendanceHistory = require('../models/attendanceRecordsModel');

//creating endpoints which will handle check-in checkout
const handleAttendance = async (req, res) => {
  const { action, userChoice } = req.body; // Capture action and user choice
  const employeeId = req.user.id;//extracting user employee Id

  const employee = await Employee.findById(employeeId);//extracting employee by employee Id 
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  //current date
  const today = new Date().toISOString().split('T')[0];
  //yesterday date 
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // // Auto-creating attendance history field if it doesn't exist
  // if (!employee.attendanceHistory) {
  //   employee.attendanceHistory = [];
  // }

  //Handling leave case issue Employee can check-in/out as normal
  //checking in the leave array if eleave is present for today.
  const leaveToday = employee.leaves.find((leave) => {
    return (
      new Date(leave.startDate) <= new Date(today) &&
      new Date(leave.endDate) >= new Date(today) &&
      leave.status === 'Approved'
    );
  });

  // Checking incomplete attendance records for yesterday
  const yesterdayAttendance = employee.attendance.find((att) => {
    return new Date(att.date).toISOString().split('T')[0] === yesterday && att.timerStart && !att.timerStop;
  });

  //
  if (yesterdayAttendance) {
    if (!userChoice) {
      return res.status(200).json({
        message: 'Incomplete attendance record for yesterday.',
        options: [
          'Recheck in at midnight and continue the timer.',
          'Check out for yesterday and start fresh today.',
        ],
      });
    }

    if (userChoice === 1) {
      // Recheck in at midnight
      yesterdayAttendance.timerStop = new Date(`${yesterday}T23:59:59Z`);
      yesterdayAttendance.timeSpent += Math.floor((new Date(yesterdayAttendance.timerStop) - new Date(yesterdayAttendance.timerStart)) / 1000);
      yesterdayAttendance.timerStart = new Date(`${today}T00:00:01Z`); // Restart timer at midnight
      yesterdayAttendance.date = new Date(today);

      // Create a new attendance record for today
      employee.attendance.push({
        date: today,
        timerStart: new Date(`${today}T00:00:01Z`),
        timeSpent: 0,
        timerStop: null,
        onLeave: leaveToday ? 'Yes' : 'No',
        
      });
    } else if (userChoice === 2) {
      // Checkout for yesterday and start fresh today
      yesterdayAttendance.timerStop = new Date(`${yesterday}T23:59:59Z`);
      yesterdayAttendance.timeSpent += Math.floor((new Date(yesterdayAttendance.timerStop) - new Date(yesterdayAttendance.timerStart)) / 1000);
      yesterdayAttendance.timerStart = null;

      // Create a new attendance record for today
      employee.attendance.push({
        date: today,
        timerStart: null,
        timeSpent: 0,
        timerStop: null,
        onLeave: leaveToday ? 'Yes' : 'No',
        
      });
    }

    await employee.save();
    return res.status(200).json({
      message: `Attendance record updated based on your choice.`,
      yesterdayAttendance,
    });
  }

  // Process today's attendance based on action (check-in/check-out)
  let attendance = employee.attendance.find((att) => {
    return new Date(att.date).toISOString().split('T')[0] === today;
  });

  if (!attendance) {
    attendance = {
      date: today,
      timerStart: null,
      timeSpent: 0,
      timerStop: null,
      onLeave: leaveToday ? 'Yes' : 'No',
      firstCheckIn: null,

    };
    employee.attendance.push(attendance);
    await employee.save();
  }

  //rechecking the updated attendance from the saved employee obj
  attendance = employee.attendance.find((att) =>{
    const attendanceDate = new Date(att.date).toISOString().split('T')[0];
    return attendanceDate === today;
    
  });

  try {
    if (action === 'check-in') {
      if (attendance.timerStart) {
        return res.status(400).json({ message: 'Already checked in.' });
      }

      const checkInTime = new Date();
      attendance.timerStart = checkInTime;
      attendance.timerStop = null;
      
      //setting status to online when chedked in
      employee.status = 'online';

      //ensure first check-in is stored only once
      if (!attendance.firstCheckIn) {
        attendance.firstCheckIn = checkInTime;
      }

      // Store check-in in AttendanceHistory schema
      await AttendanceHistory.create({
        employeeId: employee._id,
        date: attendance.date,
        timerStart: attendance.timerStart,
        action: 'check-in',
      });

      // // Add check-in entry to attendanceHistory
      // employee.attendanceHistory.push({
      //   date: attendance.date,
      //   timerStart: attendance.timerStart,
      //   action: 'check-in',
      // });
    } else if (action === 'check-out') {
      if (!attendance.timerStart) {
        return res.status(400).json({ message: 'Not checked in.' });
      }

      const now = new Date();
      attendance.timeSpent += Math.floor((now - new Date(attendance.timerStart)) / 1000);
      attendance.timerStop = now;
      attendance.timerStart = null;
      
      //setting status offline when checkout
      employee.status = 'offline';

      // // Add check-out entry to attendanceHistory
      // employee.attendanceHistory.push({
      //   date: attendance.date,
      //   timerStop: now,
      //   timeSpent: attendance.timeSpent,
      //   action: 'check-out',
      // });
      // Store check-out in AttendanceHistory schema
      await AttendanceHistory.create({
        employeeId: employee._id,
        date: attendance.date,
        timerStop: now,
        timeSpent: attendance.timeSpent,
        action: 'check-out',
      });

    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    await employee.save();

    return res.status(200).json({
      message: `Successfully ${action === 'check-in' ? 'checked in' : 'checked out'}.`,
      attendance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};



const getTimer = async (req, res) => {
  const employeeId = req.user.id; // Extracting the employee ID from the authenticated user token

  // Finding the employee by their ID
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' }); // If the employee is not found
  }

  const today = new Date().toISOString().split('T')[0]; // Getting today's date in YYYY-MM-DD format
  const attendance = employee.attendance.find((att) => {
    const attendanceDate = new Date(att.date).toISOString().split('T')[0];
    return attendanceDate === today; // Finding today's attendance record, if it exists
  });

  if (!attendance) {
    return res.status(404).json({ error: 'No attendance record found for today.' }); // If no record is found
  }

  let cumulativeTime = attendance.timeSpent; // Starting with the stored time spent
  if (attendance.timerStart) {
    // If checked in, calculate the elapsed time since last check-in
    const now = new Date();
    const elapsedSeconds = Math.floor((now - new Date(attendance.timerStart)) / 1000);

    //console.log(elapsedSeconds);
    cumulativeTime += elapsedSeconds; // Adding the elapsed time to the total
  }

  // Ensuring time will be displayed properly as HH:MM:SS
  const formattedTime = secondsToTime(cumulativeTime);

  return res.status(200).json({
    message: 'Timer fetched successfully.', // Responding with a success message
    timeSpent: formattedTime, 
  });
};

// Utility function to convert seconds to HH:MM:SS format
const secondsToTime = (seconds) => {
  const hours = Math.floor(seconds / 3600); // Calculating hours
  const minutes = Math.floor((seconds % 3600) / 60); // Calculating minutes
  const remainingSeconds = seconds % 60; // Calculating remaining seconds

  // Format the time as HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/// New endpoint to fetch employee's current status (online/offline)
const getEmployeeStatus = async (req, res) => {
  const employeeId = req.user.id;

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const attendance = employee.attendance.find((att) => {
    return new Date(att.date).toISOString().split('T')[0] === today;
  });

  if (!attendance) {
    return res.status(404).json({ error: 'No attendance record found for today.' });
  }

  return res.status(200).json({
    message: 'Employee status fetched successfully.',
    status: attendance.status, // online or offline
  });
};

const getEmployeeStatusByAdmin = async (req, res) => {
  try {
    // Extract employee ID from request params
            //checking if the logged-in user is an admin or employer 
            if(req.user.role !== 'Admin'){
              return res.status(403).json({message: 'Access forbidden: only admins or employer can see all status .'});
          }
        
            // Extract employeeId from request parameters
            const { employeeId } = req.params;
            console.log(employeeId);
            
            
            // Finding the employee to associate with the performance
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found.' });
            }


    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find today's attendance record
    const attendance = employee.attendance.find((att) => {
      return new Date(att.date).toISOString().split('T')[0] === today;
    });

    if (!attendance) {
      return res.status(404).json({ error: 'No attendance record found for today.' });
    }

    return res.status(200).json({
      message: 'Employee status fetched successfully.',
      employeeId: employee._id,
      name: employee.name, // Assuming employee has a name field
      status: attendance.status, // 'online' or 'offline'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.', details: err.message });
  }
};

// Add this to module exports
module.exports = { handleAttendance, getTimer, getEmployeeStatus, getEmployeeStatusByAdmin };


// // Utility function to add two time strings in HH:MM:SS format
// const addTimeStrings = (time1, time2) => {
//   const [hours1, minutes1, seconds1] = time1.split(':').map(Number);
//   const [hours2, minutes2, seconds2] = time2.split(':').map(Number);

//   const totalSeconds = seconds1 + seconds2;
//   const totalMinutes = minutes1 + minutes2 + Math.floor(totalSeconds / 60);
//   const totalHours = hours1 + hours2 + Math.floor(totalMinutes / 60);

//   return `${totalHours.toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
// };

// module.exports = { handleAttendance, getTimer ,getEmployeeStatus,getEmployeeStatusByAdmin};
