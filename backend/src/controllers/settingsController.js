// settingsController.js - Settings Handlers
const Setting = require('../models/Setting');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne({ userId: req.user._id });

    // If settings do not exist yet, create defaults
    if (!settings) {
      settings = await Setting.create({ userId: req.user._id });
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  const {
    dailyGoalProductive,
    dailyGoalDistracting,
    dailyGoalFocusSessions,
    focusDuration,
    notificationsEnabled,
    theme
  } = req.body;

  try {
    let settings = await Setting.findOne({ userId: req.user._id });

    if (!settings) {
      settings = new Setting({ userId: req.user._id });
    }

    if (dailyGoalProductive !== undefined) settings.dailyGoalProductive = dailyGoalProductive;
    if (dailyGoalDistracting !== undefined) settings.dailyGoalDistracting = dailyGoalDistracting;
    if (dailyGoalFocusSessions !== undefined) settings.dailyGoalFocusSessions = dailyGoalFocusSessions;
    if (focusDuration !== undefined) settings.focusDuration = focusDuration;
    if (notificationsEnabled !== undefined) settings.notificationsEnabled = notificationsEnabled;
    if (theme !== undefined) settings.theme = theme;

    await settings.save();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
