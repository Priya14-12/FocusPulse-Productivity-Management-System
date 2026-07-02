// focusRoutes.js - Focus Session Routes
const express = require('express');
const { createFocusSession, getFocusSessions } = require('../controllers/focusController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createFocusSession);
router.get('/', protect, getFocusSessions);

module.exports = router;
