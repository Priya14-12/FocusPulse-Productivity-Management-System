// activityController.js - Activity Handlers
const Activity = require('../models/Activity');

// @desc    Sync tracked website activities
// @route   POST /api/activities/sync
// @access  Private
const syncActivities = async (req, res, next) => {
  const { activities } = req.body;

  if (!activities || !Array.isArray(activities)) {
    res.status(400);
    return next(new Error('Invalid sync data. Please provide an array of activities.'));
  }

  try {
    const formattedActivities = activities.map((activity) => ({
      userId: req.user._id,
      domain: activity.domain,
      startTime: new Date(activity.startTime),
      endTime: new Date(activity.endTime),
      duration: Number(activity.duration),
      category: activity.category || 'neutral'
    }));

    // Insert all synced activities
    const insertedActivities = await Activity.insertMany(formattedActivities);

    res.status(201).json({
      message: 'Activities synchronized successfully',
      count: insertedActivities.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activities
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res, next) => {
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

    const activities = await Activity.find(query).sort({ startTime: -1 });
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncActivities,
  getActivities
};
