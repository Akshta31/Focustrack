// FocusTrack Background Service Worker
const API_BASE = 'http://localhost:5000/api';
const SYNC_INTERVAL_MINUTES = 5;
const IDLE_THRESHOLD_SECONDS = 60;

let activeTabId = null;
let activeTabStart = null;
let activeTabDomain = null;
let activeTabUrl = null;
let activeTabTitle = null;
let activeTabFavicon = null;
let pendingActivities = [];
let isTracking = true;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isTrackableUrl(url) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

async function getAuthToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(['authToken'], result => resolve(result.authToken || null));
  });
}

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['isTracking', 'pendingActivities'], result => {
      resolve({
        isTracking: result.isTracking !== false,
        pendingActivities: result.pendingActivities || []
      });
    });
  });
}

// ─── Time Tracking ─────────────────────────────────────────────────────────────

function recordActiveTab(tabId, url, title, favIconUrl) {
  if (!isTrackableUrl(url)) {
    flushCurrentSession();
    return;
  }

  const domain = extractDomain(url);
  if (!domain) return;

  // If same domain, just continue
  if (domain === activeTabDomain && tabId === activeTabId) return;

  // Flush previous session
  flushCurrentSession();

  // Start new session
  activeTabId = tabId;
  activeTabStart = Date.now();
  activeTabDomain = domain;
  activeTabUrl = url;
  activeTabTitle = title;
  activeTabFavicon = favIconUrl;
}

function flushCurrentSession() {
  if (!activeTabDomain || !activeTabStart) return;

  const duration = Math.floor((Date.now() - activeTabStart) / 1000);
  if (duration < 2) {
    // Reset
    activeTabStart = null;
    activeTabDomain = null;
    return;
  }

  pendingActivities.push({
    domain: activeTabDomain,
    url: activeTabUrl,
    title: activeTabTitle,
    favicon: activeTabFavicon,
    duration,
    startTime: new Date(activeTabStart).toISOString(),
    endTime: new Date().toISOString()
  });

  // Persist to local storage
  chrome.storage.local.set({ pendingActivities });

  // Reset
  activeTabStart = null;
  activeTabDomain = null;
  activeTabId = null;
}

// ─── Sync to Server ────────────────────────────────────────────────────────────

async function syncToServer() {
  const token = await getAuthToken();
  if (!token) return;

  const stored = await new Promise(r =>
    chrome.storage.local.get(['pendingActivities'], res => r(res.pendingActivities || []))
  );

  // Include current session
  flushCurrentSession();
  const allActivities = [...stored, ...pendingActivities.filter(a => !stored.includes(a))];

  if (allActivities.length === 0) return;

  try {
    const response = await fetch(`${API_BASE}/activity/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ activities: allActivities })
    });

    if (response.ok) {
      // Clear pending
      pendingActivities = [];
      chrome.storage.local.set({ pendingActivities: [] });
      console.log('[FocusTrack] Synced', allActivities.length, 'activities');
    }
  } catch (err) {
    console.warn('[FocusTrack] Sync failed, will retry:', err.message);
  }
}

// ─── Today's Stats (for popup) ─────────────────────────────────────────────────

async function getTodayStats() {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      chrome.storage.local.set({ cachedStats: data, statsLastUpdated: Date.now() });
      return data;
    }
  } catch {
    // Return cached
  }
  return null;
}

// ─── Chrome Event Listeners ────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!isTracking) return;
  try {
    const tab = await chrome.tabs.get(tabId);
    recordActiveTab(tabId, tab.url, tab.title, tab.favIconUrl);
  } catch {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isTracking) return;
  if (changeInfo.status === 'complete' && tab.active) {
    recordActiveTab(tabId, tab.url, tab.title, tab.favIconUrl);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) flushCurrentSession();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    flushCurrentSession();
  }
});

// Idle detection
chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'idle' || state === 'locked') {
    flushCurrentSession();
  } else if (state === 'active') {
    // Resume tracking current tab
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (tabs[0]) recordActiveTab(tabs[0].id, tabs[0].url, tabs[0].title, tabs[0].favIconUrl);
    });
  }
});

// Periodic sync alarm
chrome.alarms.create('syncActivities', { periodInMinutes: SYNC_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncActivities') syncToServer();
});

// ─── Message Handler (from popup) ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATUS') {
    sendResponse({
      isTracking,
      currentDomain: activeTabDomain,
      sessionStart: activeTabStart,
      pendingCount: pendingActivities.length
    });
    return true;
  }

  if (msg.type === 'TOGGLE_TRACKING') {
    isTracking = !isTracking;
    if (!isTracking) flushCurrentSession();
    chrome.storage.local.set({ isTracking });
    sendResponse({ isTracking });
    return true;
  }

  if (msg.type === 'SYNC_NOW') {
    syncToServer().then(() => sendResponse({ success: true }));
    return true;
  }

  if (msg.type === 'GET_TODAY_STATS') {
    getTodayStats().then(stats => sendResponse({ stats }));
    return true;
  }

  if (msg.type === 'AUTH_CHANGED') {
    // Re-init after login/logout
    pendingActivities = [];
    sendResponse({ success: true });
    return true;
  }
});

// ─── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const settings = await getSettings();
  isTracking = settings.isTracking;
  pendingActivities = settings.pendingActivities;

  // Track current active tab
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) recordActiveTab(tab.id, tab.url, tab.title, tab.favIconUrl);

  console.log('[FocusTrack] Background worker initialized');
}

init();
