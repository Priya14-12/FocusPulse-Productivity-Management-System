// Report.js - Mongoose Model
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  totalTime: {
    type: Number, // seconds
    default: 0
  },
  productiveTime: {
    type: Number, // seconds
    default: 0
  },
  neutralTime: {
    type: Number, // seconds
    default: 0
  },
  distractingTime: {
    type: Number, // seconds
    default: 0
  },
  mostVisitedSite: {
    type: String,
    default: ''
  },
  productivityScore: {
    type: Number, // 0 to 100
    min: 0,
    max: 100,
    default: 0
  },
  focusSessionsCount: {
    type: Number,
    default: 0
  },
  blockedAttemptsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure a user only has one report per date
ReportSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Report', ReportSchema);
