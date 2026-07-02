// BlockedSite.js - Mongoose Model
const mongoose = require('mongoose');

const BlockedSiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  blockedAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure a user cannot block the same domain multiple times in separate documents
BlockedSiteSchema.index({ userId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('BlockedSite', BlockedSiteSchema);
