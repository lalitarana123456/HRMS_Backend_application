const Attendance = require('../models/AttendanceModel');

exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await Attendance.aggregate([
      {
        $project: {
          employeeId: 1,
          date: 1,
          workingHours: {
            $divide: [
              { $subtract: ['$checkOut', '$checkIn'] },
              1000 * 60 * 60
            ],
          },
          totalBreakHours: {
            $sum: {
              $map: {
                input: '$breaks',
                as: 'break',
                in: {
                  $divide: [
                    { $subtract: ['$$break.end', '$$break.start'] },
                    1000 * 60 * 60
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({ analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
