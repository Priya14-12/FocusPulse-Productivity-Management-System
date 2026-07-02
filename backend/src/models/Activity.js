// Activity.js - Mongoose Model
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true, // duration in seconds
    min: 0
  },
  category: {
    type: String,
    enum: ['productive', 'neutral', 'distracting'],
    default: 'neutral'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', ActivitySchema);
