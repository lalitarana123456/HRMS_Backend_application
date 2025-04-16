const express = require('express');
//const { postAnnouncement, getAnnouncements } = require('../controllers/announcementController')//;
const { postAnnouncement, getAnnouncements } = require('../controllers/announcementController');
const router = express.Router();

router.post('/announcements', postAnnouncement);
router.get('/fetching', getAnnouncements);

module.exports = router;
