const API_BASE = 'http://localhost:5000/api';
const DASHBOARD_URL = 'http://localhost:3000';

// DOM refs
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const loadingScreen = document.getElementById('loading-screen');

let timerInterval = null;
let sessionStart = null;

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getToken() {
  return new Promise(r => chrome.storage.local.get(['authToken'], res => r(res.authToken || null)));
}

async function setToken(token) {
  return new Promise(r => chrome.storage.local.set({ authToken: token }, r));
}

async function clearToken() {
  return new Promise(r => chrome.storage.local.remove(['authToken', 'cachedStats'], r));
}

async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  return res.json();
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── UI Updates ───────────────────────────────────────────────────────────────

function showScreen(name) {
  authScreen.classList.add('hidden');
  mainScreen.classList.add('hidden');
  loadingScreen.classList.add('hidden');
  document.getElementById(`${name}-screen`).classList.remove('hidden');
}

function updateStats(data) {
  if (!data?.current) return;
  const { current } = data;
  document.getElementById('today-score').textContent = `${current.productivityScore || 0}%`;
  document.getElementById('today-total').textContent = formatTime(current.totalDuration || 0);
  document.getElementById('today-productive').textContent = formatTime(current.productiveDuration || 0);
  document.getElementById('today-unproductive').textContent = formatTime(current.unproductiveDuration || 0);

  const pct = current.productivityScore || 0;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

function startTimer(startTimestamp) {
  clearInterval(timerInterval);
  sessionStart = startTimestamp;
  timerInterval = setInterval(() => {
    if (!sessionStart) return;
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    document.getElementById('session-timer').textContent = formatTimer(elapsed);
  }, 1000);
}

// ─── Main screen ──────────────────────────────────────────────────────────────

async function loadMainScreen() {
  showScreen('main');

  // Get status from background
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (status) => {
    if (status?.currentDomain) {
      document.getElementById('current-domain').textContent = status.currentDomain;
      if (status.sessionStart) startTimer(status.sessionStart);
    }

    const indicator = document.getElementById('tracking-indicator');
    const toggleBtn = document.getElementById('toggle-tracking-btn');
    if (status?.isTracking) {
      indicator.classList.add('active');
      toggleBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
    } else {
      indicator.classList.remove('active');
      toggleBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume';
    }
  });

  // Load cached stats
  chrome.storage.local.get(['cachedStats'], (res) => {
    if (res.cachedStats) updateStats(res.cachedStats);
  });

  // Fetch fresh stats
  chrome.runtime.sendMessage({ type: 'GET_TODAY_STATS' }, (res) => {
    if (res?.stats) updateStats(res.stats);
  });
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (data.token) {
    await setToken(data.token);
    chrome.runtime.sendMessage({ type: 'AUTH_CHANGED' });
    errEl.classList.add('hidden');
    loadMainScreen();
  } else {
    errEl.textContent = data.error || 'Login failed';
    errEl.classList.remove('hidden');
  }

  btn.disabled = false;
  btn.textContent = 'Sign In';
});

// Register
document.getElementById('register-btn').addEventListener('click', async () => {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');

  if (!name || !email || !password) {
    errEl.textContent = 'Please fill in all fields';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });

  if (data.token) {
    await setToken(data.token);
    chrome.runtime.sendMessage({ type: 'AUTH_CHANGED' });
    errEl.classList.add('hidden');
    loadMainScreen();
  } else {
    errEl.textContent = data.error || 'Registration failed';
    errEl.classList.remove('hidden');
  }

  btn.disabled = false;
  btn.textContent = 'Create Account';
});

// Show/hide auth forms
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  clearInterval(timerInterval);
  await clearToken();
  chrome.runtime.sendMessage({ type: 'AUTH_CHANGED' });
  showScreen('auth');
});

// Toggle tracking
document.getElementById('toggle-tracking-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'TOGGLE_TRACKING' }, (res) => {
    const indicator = document.getElementById('tracking-indicator');
    const btn = document.getElementById('toggle-tracking-btn');
    if (res?.isTracking) {
      indicator.classList.add('active');
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
    } else {
      indicator.classList.remove('active');
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume';
      clearInterval(timerInterval);
    }
  });
});

// Open dashboard
document.getElementById('open-dashboard-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: DASHBOARD_URL });
});

// Sync
document.getElementById('sync-btn').addEventListener('click', () => {
  const syncStatus = document.getElementById('sync-status');
  syncStatus.textContent = 'Syncing…';
  chrome.runtime.sendMessage({ type: 'SYNC_NOW' }, () => {
    syncStatus.textContent = 'Synced just now';
  });
});

// ─── Init ────────────────────────────────────────────────────────────────────

(async () => {
  showScreen('loading');
  const token = await getToken();
  if (token) {
    // Verify token still valid
    const data = await apiRequest('/auth/me').catch(() => null);
    if (data?.user) {
      loadMainScreen();
    } else {
      await clearToken();
      showScreen('auth');
    }
  } else {
    showScreen('auth');
  }
})();
