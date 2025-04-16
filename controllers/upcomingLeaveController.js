const UpcomingLeave = require('../models/upcomingLeaveModel');
const moment = require("moment"); // Ensure moment.js is installed

//admin or employer can create any specific upcomming leave 
exports.createUpcomingLeave = async (req, res) => {
    try {
        // fixing only admin or employer can create
        if (req.user.role !== "Admin" && req.user.role !== "Employer") {
            return res.status(403).json({
                message: "Access forbidden: only admins or employers can create upcoming leaves."
            });
        }

        const { title, date, description } = req.body;
        if (!title || !date) {
            return res.status(400).json({ message: "Title and date are required." });
        }

        const formattedDate = moment(date, "YYYY-MM-DD", true);
        const today = moment().startOf("day");

        // Rrestricting past date creation
        if (!formattedDate.isValid() || formattedDate.isBefore(today)) {
            return res.status(400).json({
                message: "You cannot create an upcoming leave for a past date."
            });
        }

        const currentYear = new Date().getFullYear();
        
        //fixed public holidays which no can modify
        const fixedHolidays = [
            { title: "New Year Holiday", date: moment(`${currentYear}-01-01`).format("YYYY-MM-DD") },
            { title: "Republic Day (India)", date: moment(`${currentYear}-01-26`).format("YYYY-MM-DD") },
            { title: "Dublicate Fixed Leave", date: moment(`${currentYear}-02-26`).format("YYYY-MM-DD") },
            { title: "Dublicate22 Fixed Leave", date: moment(`${currentYear}-02-27`).format("YYYY-MM-DD") },
            { title: "Mahavir Jayanti", date: moment(`${currentYear}-04-14`).format("YYYY-MM-DD") },
            { title: "Independence Day", date: moment(`${currentYear}-08-15`).format("YYYY-MM-DD") },
            { title: "Gandhi Jayanti", date: moment(`${currentYear}-10-02`).format("YYYY-MM-DD") },
            { title: "Christmas Day", date: moment(`${currentYear}-12-25`).format("YYYY-MM-DD") }
        ];

        // checking if the provided date matches any fixed holiday
        const isFixedHoliday = fixedHolidays.some(holiday => holiday.date === formattedDate.format("YYYY-MM-DD"));

        if (isFixedHoliday) {
            return res.status(400).json({ 
                message: "This date is already reserved for a fixed holiday. You cannot create a leave on this date." 
            });
        }

         // Check if an upcoming leave already exists for the selected date
        const existingLeave = await UpcomingLeave.findOne({ date: formattedDate.format("YYYY-MM-DD") });

        if (existingLeave) {
            return res.status(400).json({ 
                message: "An upcoming leave is already created for this date. You cannot create another one on the same day." 
            });
        }

        //now creating new upcoming leave
        const newLeave = new UpcomingLeave({
            title,
            date: formattedDate.format("YYYY-MM-DD"),
            description
        });

        // saving the upcoming leave into the database
        const savedUpcomingLeave = await newLeave.save();

        res.status(201).json({ 
            message: "Upcoming leave is created successfully.", 
            leave: savedUpcomingLeave 
        });

    } catch (error) {
        console.error("Error creating upcoming leave:", error);
        res.status(500).json({ error: error.message });
    }
};
//now logged-in employee can get upcoming leave
exports.getUpcomingLeaves = async (req, res) => {

    try {
        const currentYear = moment().year(); // get current year
        const currentMonth = moment().month(); // get current month index (0-11)
        const currentDate = moment().format("YYYY-MM-DD"); // standard format for comparisons

        // fixed public holidays (stored in 'YYYY-MM-DD' format for accurate comparison)
        const fixedHolidays = [
            { title: "New Year Holiday", date: `${currentYear}-01-01`, color: "#0070FF" },
            { title: "Republic Day (India)", date: `${currentYear}-01-26`, color: "#0070FF" },
            { title: "Dublicate Fixed Leave", date: `${currentYear}-02-26`, color: "#0070FF" },
            { title: "Mahavir Jayanti", date: `${currentYear}-04-14`, color: "#0070FF" },
            { title: "Independence Day", date: `${currentYear}-08-15`, color: "#0070FF" },
            { title: "Gandhi Jayanti", date: `${currentYear}-10-02`, color: "#0070FF" },
            { title: "Christmas Day", date: `${currentYear}-12-25`, color: "#0070FF" }
        ];

        // fetching upcoming leaves from the database
        const upcomingLeaves = await UpcomingLeave.find().select("title date description");

        // formatting and filter database leaves for the current month
        const formattedLeavesAllLeaves = upcomingLeaves.map(leave => ({
            _id: leave._id,
            title: leave.title,
            date: moment(leave.date).format("YYYY-MM-DD"), // now keeping  ISO format for processing to avoid the depreceiated warning
        })).filter(leave => {
            const leaveDate = moment(leave.date, "YYYY-MM-DD"); // making correct parsing
            return leaveDate.isSameOrAfter(moment(), "day") && leaveDate.month() === currentMonth;
        });

        // merginf and filter only leaves for the current month
        const formattedLeaves = [
            ...formattedLeavesAllLeaves,
            ...fixedHolidays.filter(leave => {
                const leaveDate = moment(leave.date, "YYYY-MM-DD");
                return leaveDate.isSameOrAfter(moment(), "day") && leaveDate.month() === currentMonth;
            })
        ]
        .sort((a, b) => moment(a.date).diff(moment(b.date))) // sorting correctly
        .map(leave => ({
            ...leave,
            date: moment(leave.date, "YYYY-MM-DD").format("MMMM D, YYYY") // formatting only for response
        }));

        res.status(200).json({ success: true, upcomingLeaves: formattedLeaves });
    } catch (error) {
        console.error("Error fetching upcoming leaves:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

//fixed public leaves which will not vary by date or year.
exports.getFixedPublicHolidays = async (req, res) => {
    try {
        // getting the current year dynamically
        const currentYear = new Date().getFullYear();

        // fixed public holidays no year stored, dynamically added
        const fixedHolidays = [
            { title: "New Year's Day", date: `${currentYear}-01-01`, color: "#0070FF" },
            { title: "Republic Day (India)", date: `${currentYear}-01-26`, color: "#0070FF" },
            { title: "Dublicate Fixed Leave", date: moment(`${currentYear}-02-26`).format("YYYY-MM-DD") },
            { title: "Mahavir Jayanti", date: `${currentYear}-04-14`, color: "#0070FF" },
            { title: "Independence Day", date: `${currentYear}-08-15`, color: "#0070FF" },
            { title: "Gandhi Jayanti", date: `${currentYear}-10-02`, color: "#0070FF" },
            { title: "Christmas Day", date: `${currentYear}-12-25`, color: "#0070FF" }
        ];

        res.status(200).json({ success: true, holidays: fixedHolidays });
    } catch (error) {
        console.error("Error fetching fixed holidays:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.getAllUpcomingLeaves = async (req, res) => {
    try {
        const upcomingLeaves = await UpcomingLeave.find().select("title date description createdAt");
        
        const formattedLeaves = upcomingLeaves.map(leave => ({
            _id: leave._id,
            title: leave.title,
            date: leave.date.toISOString().split("T")[0],  // formatting date
            description: leave.description,
            //createdAt: leave.createdAt.toISOString().split("T")[0]  // formatting createdAt
        }));
        res.status(200).json({ success: true, upcomingLeaves: formattedLeaves });
    } catch (error) {
        console.error("Error fetching upcoming leaves:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};