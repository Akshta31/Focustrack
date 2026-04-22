const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const CategoryRule = require('../models/CategoryRule');
const { protect } = require('../middleware/auth');
const { classifyDomain } = require('../utils/classifier');

// POST /api/activity/batch - Bulk submit activities from extension
router.post('/batch', protect, async (req, res, next) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'Activities array required' });
    }

    // Get user's custom category rules
    const customRules = await CategoryRule.find({ userId: req.user._id });
    const rulesMap = {};
    customRules.forEach(rule => {
      rulesMap[rule.domain] = { category: rule.category, label: rule.label };
    });

    // Classify and prepare activities
    const toInsert = activities.map(act => {
      const domain = act.domain?.toLowerCase();
      let { category, label } = rulesMap[domain] || classifyDomain(domain);

      return {
        userId: req.user._id,
        domain: act.domain,
        url: act.url,
        title: act.title,
        favicon: act.favicon,
        duration: act.duration,
        category,
        categoryLabel: label,
        date: new Date(act.startTime).setHours(0, 0, 0, 0),
        startTime: new Date(act.startTime),
        endTime: new Date(act.endTime)
      };
    });

    await Activity.insertMany(toInsert, { ordered: false });

    res.status(201).json({ success: true, count: toInsert.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/today
router.get('/today', protect, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await Activity.find({
      userId: req.user._id,
      startTime: { $gte: today, $lt: tomorrow }
    }).sort({ startTime: -1 }).limit(100);

    res.json({ success: true, activities });
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/range?start=&end=
router.get('/range', protect, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const activities = await Activity.find({
      userId: req.user._id,
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: -1 });

    res.json({ success: true, activities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
