const Event = require("../models/eventModel"); // Import the Event model

// Create an event
const createEvent = async (req, res) => {
    try {
        const { title, description, date } = req.body;

        if (!title || !description || !date) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const eventDate = new Date(date);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Normalize current date to avoid time comparison issues

        if (eventDate < currentDate) {
            return res.status(400).json({ success: false, message: "Event date cannot be in the past" });
        }

        const newEvent = new Event({ title, description, date });
        await newEvent.save();

        res.status(201).json({ success: true, message: "Event created successfully", event: newEvent });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



// Get all events
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({});
        res.status(200).json({ success: true, events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { createEvent, getAllEvents }; // ✅ Correctly export functions

