// Setting.js - Mongoose Model
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dailyGoalProductive: {
    type: Number, // in seconds (e.g. 14400 = 4 hours)
    default: 14400
  },
  dailyGoalDistracting: {
    type: Number, // in seconds (e.g. 3600 = 1 hour)
    default: 3600
  },
  dailyGoalFocusSessions: {
    type: Number, // e.g. 3 sessions
    default: 3
  },
  focusDuration: {
    type: Number, // in minutes (25, 50, 60)
    enum: [25, 50, 60],
    default: 25
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);
