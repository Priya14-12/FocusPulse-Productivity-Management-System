// blockedRoutes.js - Blocked Websites Routes
const express = require('express');
const {
  getBlockedSites,
  addBlockedSite,
  removeBlockedSite,
  recordBlockedAttempt
} = require('../controllers/blockedController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getBlockedSites);
router.post('/', protect, addBlockedSite);
router.delete('/:id', protect, removeBlockedSite);
router.post('/attempt', protect, recordBlockedAttempt);

module.exports = router;
