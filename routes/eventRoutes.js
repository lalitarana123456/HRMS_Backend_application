const express = require("express");
const { createEvent, getAllEvents } = require("../controllers/eventController");

const router = express.Router();

router.post('/events', createEvent);    // Create event
router.get('/events', getAllEvents);    // Get all events

module.exports = router;
