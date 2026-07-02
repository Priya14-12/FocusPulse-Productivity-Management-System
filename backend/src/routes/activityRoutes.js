// activityRoutes.js - Activity Sync Routes
const express = require('express');
const { syncActivities, getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/sync', protect, syncActivities);
router.get('/', protect, getActivities);

module.exports = router;
