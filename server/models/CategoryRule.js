const mongoose = require('mongoose');

const categoryRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    enum: ['productive', 'unproductive', 'neutral'],
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  isCustom: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

categoryRuleSchema.index({ userId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('CategoryRule', categoryRuleSchema);
