// focusController.js - Focus Session Handlers
const FocusSession = require('../models/FocusSession');

// @desc    Create/Save a focus session
// @route   POST /api/focus-sessions
// @access  Private
const createFocusSession = async (req, res, next) => {
  const { startTime, endTime, duration, completed } = req.body;

  if (!startTime || duration === undefined) {
    res.status(400);
    return next(new Error('Please provide startTime and duration in seconds'));
  }

  try {
    const session = await FocusSession.create({
      userId: req.user._id,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      duration: Number(duration),
      completed: completed || false
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's focus sessions
// @route   GET /api/focus-sessions
// @access  Private
const getFocusSessions = async (req, res, next) => {
  const { startDate, endDate } = req.query;

  try {
    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    const sessions = await FocusSession.find(query).sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFocusSession,
  getFocusSessions
};
