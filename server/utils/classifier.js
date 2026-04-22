const DEFAULT_RULES = {
  // Productive - Software Development
  'github.com': { category: 'productive', label: 'Software Development' },
  'gitlab.com': { category: 'productive', label: 'Software Development' },
  'bitbucket.org': { category: 'productive', label: 'Software Development' },
  'stackoverflow.com': { category: 'productive', label: 'Software Development' },
  'vscode.dev': { category: 'productive', label: 'Software Development' },
  'codepen.io': { category: 'productive', label: 'Software Development' },
  'replit.com': { category: 'productive', label: 'Software Development' },
  'npmjs.com': { category: 'productive', label: 'Software Development' },
  'developer.mozilla.org': { category: 'productive', label: 'Software Development' },
  'docs.python.org': { category: 'productive', label: 'Software Development' },
  'leetcode.com': { category: 'productive', label: 'Software Development' },
  'hackerrank.com': { category: 'productive', label: 'Software Development' },

  // Productive - Learning
  'coursera.org': { category: 'productive', label: 'Learning' },
  'udemy.com': { category: 'productive', label: 'Learning' },
  'edx.org': { category: 'productive', label: 'Learning' },
  'khanacademy.org': { category: 'productive', label: 'Learning' },
  'pluralsight.com': { category: 'productive', label: 'Learning' },
  'freecodecamp.org': { category: 'productive', label: 'Learning' },
  'medium.com': { category: 'productive', label: 'Learning' },
  'dev.to': { category: 'productive', label: 'Learning' },
  'wikipedia.org': { category: 'productive', label: 'Learning' },

  // Productive - Design Tools
  'figma.com': { category: 'productive', label: 'Design Tools' },
  'sketch.com': { category: 'productive', label: 'Design Tools' },
  'canva.com': { category: 'productive', label: 'Design Tools' },
  'dribbble.com': { category: 'productive', label: 'Design Tools' },
  'behance.net': { category: 'productive', label: 'Design Tools' },

  // Productive - Productivity
  'notion.so': { category: 'productive', label: 'Productivity' },
  'trello.com': { category: 'productive', label: 'Productivity' },
  'asana.com': { category: 'productive', label: 'Productivity' },
  'linear.app': { category: 'productive', label: 'Productivity' },
  'jira.atlassian.com': { category: 'productive', label: 'Productivity' },
  'docs.google.com': { category: 'productive', label: 'Productivity' },
  'sheets.google.com': { category: 'productive', label: 'Productivity' },
  'slides.google.com': { category: 'productive', label: 'Productivity' },

  // Communication (neutral)
  'mail.google.com': { category: 'neutral', label: 'Communication' },
  'outlook.com': { category: 'neutral', label: 'Communication' },
  'slack.com': { category: 'neutral', label: 'Communication' },
  'teams.microsoft.com': { category: 'neutral', label: 'Communication' },
  'zoom.us': { category: 'neutral', label: 'Communication' },
  'meet.google.com': { category: 'neutral', label: 'Communication' },

  // Social Media (unproductive)
  'facebook.com': { category: 'unproductive', label: 'Social Media' },
  'instagram.com': { category: 'unproductive', label: 'Social Media' },
  'twitter.com': { category: 'unproductive', label: 'Social Media' },
  'x.com': { category: 'unproductive', label: 'Social Media' },
  'tiktok.com': { category: 'unproductive', label: 'Social Media' },
  'snapchat.com': { category: 'unproductive', label: 'Social Media' },
  'reddit.com': { category: 'unproductive', label: 'Social Media' },
  'pinterest.com': { category: 'unproductive', label: 'Social Media' },
  'linkedin.com': { category: 'neutral', label: 'Professional Networking' },

  // Entertainment (unproductive)
  'youtube.com': { category: 'unproductive', label: 'Entertainment' },
  'netflix.com': { category: 'unproductive', label: 'Entertainment' },
  'twitch.tv': { category: 'unproductive', label: 'Entertainment' },
  'hulu.com': { category: 'unproductive', label: 'Entertainment' },
  'disneyplus.com': { category: 'unproductive', label: 'Entertainment' },
  'primevideo.com': { category: 'unproductive', label: 'Entertainment' },
  'spotify.com': { category: 'neutral', label: 'Music' },

  // Shopping (unproductive)
  'amazon.com': { category: 'unproductive', label: 'Shopping' },
  'ebay.com': { category: 'unproductive', label: 'Shopping' },

  // News (neutral)
  'news.ycombinator.com': { category: 'neutral', label: 'News' },
  'bbc.com': { category: 'neutral', label: 'News' },
  'cnn.com': { category: 'neutral', label: 'News' },
  'techcrunch.com': { category: 'neutral', label: 'News' }
};

function classifyDomain(domain) {
  if (!domain) return { category: 'neutral', label: 'Uncategorized' };

  // Exact match
  if (DEFAULT_RULES[domain]) return DEFAULT_RULES[domain];

  // Subdomain match (e.g. mail.google.com -> google.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DEFAULT_RULES[parent]) return DEFAULT_RULES[parent];
  }

  return { category: 'neutral', label: 'Uncategorized' };
}

module.exports = { classifyDomain, DEFAULT_RULES };
