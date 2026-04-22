const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// GET /api/analytics/weekly?start=
router.get('/weekly', protect, async (req, res, next) => {
  try {
    const { start } = req.query;
    const startDate = start ? new Date(start) : getWeekStart();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const activities = await Activity.find({
      userId: req.user._id,
      startTime: { $gte: startDate, $lt: endDate }
    });

    const analytics = computeAnalytics(activities, startDate, 7);
    res.json({ success: true, ...analytics, period: { start: startDate, end: endDate } });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/dashboard
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const weekStart = getWeekStart(now);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);

    const [currentWeekActivities, prevWeekActivities] = await Promise.all([
      Activity.find({ userId: req.user._id, startTime: { $gte: weekStart, $lt: weekEnd } }),
      Activity.find({ userId: req.user._id, startTime: { $gte: prevWeekStart, $lt: prevWeekEnd } })
    ]);

    const current = computeAnalytics(currentWeekActivities, weekStart, 7);
    const previous = computeAnalytics(prevWeekActivities, prevWeekStart, 7);

    // Top websites
    const domainMap = {};
    currentWeekActivities.forEach(act => {
      if (!domainMap[act.domain]) {
        domainMap[act.domain] = {
          domain: act.domain,
          favicon: act.favicon,
          duration: 0,
          category: act.category,
          categoryLabel: act.categoryLabel
        };
      }
      domainMap[act.domain].duration += act.duration;
    });

    const topWebsites = Object.values(domainMap)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    res.json({
      success: true,
      current,
      previous,
      topWebsites,
      period: { start: weekStart, end: weekEnd }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/categories
router.get('/categories', protect, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : getWeekStart();
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const activities = await Activity.find({
      userId: req.user._id,
      startTime: { $gte: startDate, $lte: endDate }
    });

    const categoryMap = {};
    activities.forEach(act => {
      const key = act.categoryLabel || 'Uncategorized';
      if (!categoryMap[key]) {
        categoryMap[key] = { label: key, category: act.category, duration: 0 };
      }
      categoryMap[key].duration += act.duration;
    });

    const categories = Object.values(categoryMap).sort((a, b) => b.duration - a.duration);
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function computeAnalytics(activities, startDate, days) {
  let totalDuration = 0;
  let productiveDuration = 0;
  let unproductiveDuration = 0;

  // Daily breakdown
  const dailyMap = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = { date: key, productive: 0, unproductive: 0, neutral: 0, total: 0 };
  }

  activities.forEach(act => {
    totalDuration += act.duration;
    const key = new Date(act.startTime).toISOString().split('T')[0];

    if (act.category === 'productive') productiveDuration += act.duration;
    else if (act.category === 'unproductive') unproductiveDuration += act.duration;

    if (dailyMap[key]) {
      dailyMap[key][act.category] += act.duration;
      dailyMap[key].total += act.duration;
    }
  });

  const productivityScore = totalDuration > 0
    ? Math.round((productiveDuration / totalDuration) * 100)
    : 0;

  return {
    totalDuration,
    productiveDuration,
    unproductiveDuration,
    neutralDuration: totalDuration - productiveDuration - unproductiveDuration,
    productivityScore,
    dailyBreakdown: Object.values(dailyMap)
  };
}

module.exports = router;
