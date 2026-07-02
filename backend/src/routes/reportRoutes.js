// reportRoutes.js - Reports Routes
const express = require('express');
const { getReports, generateReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getReports);
router.post('/generate', protect, generateReport);

module.exports = router;
