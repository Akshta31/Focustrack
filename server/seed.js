require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Activity = require('./models/Activity');
const CategoryRule = require('./models/CategoryRule');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/focustrack';

// ── Mock Sites ────────────────────────────────────────────────────────────────
const SITES = [
  // Productive
  { domain: 'github.com',          category: 'productive',   label: 'Software Development', weight: 14 },
  { domain: 'stackoverflow.com',   category: 'productive',   label: 'Software Development', weight: 8  },
  { domain: 'vscode.dev',          category: 'productive',   label: 'Software Development', weight: 6  },
  { domain: 'figma.com',           category: 'productive',   label: 'Design Tools',         weight: 9  },
  { domain: 'notion.so',           category: 'productive',   label: 'Productivity',         weight: 5  },
  { domain: 'coursera.org',        category: 'productive',   label: 'Learning',             weight: 4  },
  { domain: 'developer.mozilla.org',category:'productive',   label: 'Software Development', weight: 5  },
  { domain: 'leetcode.com',        category: 'productive',   label: 'Software Development', weight: 3  },
  { domain: 'trello.com',          category: 'productive',   label: 'Productivity',         weight: 3  },
  { domain: 'linear.app',          category: 'productive',   label: 'Productivity',         weight: 2  },
  // Neutral
  { domain: 'mail.google.com',     category: 'neutral',      label: 'Communication',        weight: 7  },
  { domain: 'slack.com',           category: 'neutral',      label: 'Communication',        weight: 6  },
  { domain: 'zoom.us',             category: 'neutral',      label: 'Communication',        weight: 3  },
  { domain: 'meet.google.com',     category: 'neutral',      label: 'Communication',        weight: 2  },
  { domain: 'calendar.google.com', category: 'neutral',      label: 'Communication',        weight: 2  },
  { domain: 'news.ycombinator.com',category: 'neutral',      label: 'News',                 weight: 3  },
  // Unproductive
  { domain: 'youtube.com',         category: 'unproductive', label: 'Entertainment',        weight: 10 },
  { domain: 'twitter.com',         category: 'unproductive', label: 'Social Media',         weight: 7  },
  { domain: 'reddit.com',          category: 'unproductive', label: 'Social Media',         weight: 6  },
  { domain: 'instagram.com',       category: 'unproductive', label: 'Social Media',         weight: 4  },
  { domain: 'netflix.com',         category: 'unproductive', label: 'Entertainment',        weight: 3  },
  { domain: 'twitch.tv',           category: 'unproductive', label: 'Entertainment',        weight: 2  },
];

const PAGE_TITLES = {
  'github.com':           ['Pull Request #142 · focustrack', 'Issues · focustrack/api', 'Comparing changes · main', 'Actions · CI Pipeline'],
  'stackoverflow.com':    ['How to debounce in React?', 'MongoDB aggregation pipeline', 'Express CORS error fix', 'JWT best practices'],
  'figma.com':            ['Dashboard Design — FocusTrack', 'Component Library v2', 'Mobile Wireframes', 'Design System'],
  'notion.so':            ['Sprint Planning', 'Project Roadmap', 'Meeting Notes', 'Tech Spec v1'],
  'youtube.com':          ['Clean Code — Uncle Bob', 'React 18 Deep Dive', 'Lo-fi Coding Music', 'System Design Interview'],
  'twitter.com':          ['Home / Twitter', 'Trending Topics', 'Notifications'],
  'reddit.com':           ['r/programming', 'r/webdev', 'r/javascript', 'r/reactjs'],
  'mail.google.com':      ['Inbox — Gmail', 'Compose — Gmail', 'Sent — Gmail'],
  'slack.com':            ['#general — Slack', '#dev-team — Slack', 'Direct Messages'],
  'coursera.org':         ['Full-Stack Web Development', 'Data Structures Course', 'System Design Fundamentals'],
  'leetcode.com':         ['Two Sum — LeetCode', 'Binary Search Problems', 'Dynamic Programming'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function weightedRandom(sites) {
  const total = sites.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const site of sites) {
    r -= site.weight;
    if (r <= 0) return site;
  }
  return sites[sites.length - 1];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTitle(domain) {
  const titles = PAGE_TITLES[domain];
  if (!titles) return domain;
  return titles[Math.floor(Math.random() * titles.length)];
}

function generateDayActivities(userId, date, isWeekend) {
  const activities = [];

  // Weekends: less productive, shorter sessions
  const sessionCount = isWeekend ? randomInt(4, 10) : randomInt(10, 22);
  const workdayBias = isWeekend
    ? SITES  // no bias on weekends
    : SITES.map(s => ({
        ...s,
        weight: s.category === 'productive' ? s.weight * 2 : s.weight
      }));

  // Generate sessions throughout the day
  // Workday: mostly 8am–7pm, Weekend: 10am–11pm
  const dayStart = isWeekend ? 10 : 8;
  const dayEnd   = isWeekend ? 23 : 20;

  let cursor = new Date(date);
  cursor.setHours(dayStart, randomInt(0, 30), 0, 0);

  for (let i = 0; i < sessionCount; i++) {
    const site = weightedRandom(workdayBias);
    // Duration: 1min – 45min, productive sites tend to be longer
    const minDur = site.category === 'productive' ? 120 : 60;
    const maxDur = site.category === 'productive' ? 2700 : 1200;
    const duration = randomInt(minDur, maxDur);

    const startTime = new Date(cursor);
    const endTime   = new Date(cursor.getTime() + duration * 1000);

    // Don't go past end of day
    if (endTime.getHours() >= dayEnd) break;

    activities.push({
      userId,
      domain:        site.domain,
      url:           `https://${site.domain}/`,
      title:         randomTitle(site.domain),
      favicon:       `https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`,
      duration,
      category:      site.category,
      categoryLabel: site.label,
      date:          new Date(date.setHours(0, 0, 0, 0)),
      startTime,
      endTime,
    });

    // Gap between sessions: 1–15 min
    cursor = new Date(endTime.getTime() + randomInt(60, 900) * 1000);
  }

  return activities;
}

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Activity.deleteMany({}),
      CategoryRule.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ✅ Use User.create() so the pre-save hook hashes the password correctly
    const user = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@focustrack.io',
      password: 'password123',
      productivityGoal: 6,
    });
    console.log(`👤 Created user: ${user.email} / password123`);

    // Generate 21 days of activity (3 weeks back → today)
    const allActivities = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let daysAgo = 20; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      const dow = date.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;

      const dayActs = generateDayActivities(user._id, new Date(date), isWeekend);
      allActivities.push(...dayActs);
    }

    await Activity.insertMany(allActivities);
    console.log(`📊 Inserted ${allActivities.length} activity records across 21 days`);

    // Create some custom category rules
    const customRules = [
      { userId: user._id, domain: 'reddit.com',    category: 'unproductive', label: 'Social Media',         isCustom: true },
      { userId: user._id, domain: 'news.ycombinator.com', category: 'productive', label: 'Learning',        isCustom: true },
      { userId: user._id, domain: 'spotify.com',   category: 'neutral',      label: 'Music',                isCustom: true },
      { userId: user._id, domain: 'linear.app',    category: 'productive',   label: 'Productivity',         isCustom: true },
      { userId: user._id, domain: 'figma.com',     category: 'productive',   label: 'Design Tools',         isCustom: true },
    ];
    await CategoryRule.insertMany(customRules);
    console.log(`🏷️  Created ${customRules.length} custom category rules`);

    // Print summary
    const prodCount   = allActivities.filter(a => a.category === 'productive').length;
    const unprodCount = allActivities.filter(a => a.category === 'unproductive').length;
    const neutCount   = allActivities.filter(a => a.category === 'neutral').length;
    const totalMins   = Math.round(allActivities.reduce((s, a) => s + a.duration, 0) / 60);

    console.log('\n── Summary ──────────────────────────────');
    console.log(`   Total sessions  : ${allActivities.length}`);
    console.log(`   Total time      : ${Math.floor(totalMins/60)}h ${totalMins%60}m`);
    console.log(`   Productive      : ${prodCount} sessions`);
    console.log(`   Unproductive    : ${unprodCount} sessions`);
    console.log(`   Neutral         : ${neutCount} sessions`);
    console.log('─────────────────────────────────────────');
    console.log('\n🎉 Seed complete! Login with:');
    console.log('   Email   : sarah@focustrack.io');
    console.log('   Password: password123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();