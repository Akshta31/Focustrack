const express = require('express');
const router = express.Router();
const CategoryRule = require('../models/CategoryRule');
const { protect } = require('../middleware/auth');

// GET /api/categories - Get user's custom rules + defaults
router.get('/', protect, async (req, res, next) => {
  try {
    const customRules = await CategoryRule.find({ userId: req.user._id });
    res.json({ success: true, rules: customRules });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories - Add/update a rule
router.post('/', protect, async (req, res, next) => {
  try {
    const { domain, category, label } = req.body;

    if (!domain || !category || !label) {
      return res.status(400).json({ error: 'domain, category and label are required' });
    }

    const rule = await CategoryRule.findOneAndUpdate(
      { userId: req.user._id, domain: domain.toLowerCase() },
      { category, label, isCustom: true },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const rule = await CategoryRule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
