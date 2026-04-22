const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // seconds
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['productive', 'unproductive', 'neutral'],
    default: 'neutral'
  },
  categoryLabel: {
    type: String, // e.g. "Software Development", "Social Media"
    default: 'Uncategorized'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Compound index for efficient queries
activitySchema.index({ userId: 1, date: -1 });
activitySchema.index({ userId: 1, domain: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
