// popup.js - Extension Popup Controller

const BACKEND_URL = 'http://localhost:5000/api';

// DOM Selectors
const authSection = document.getElementById('auth-section');
const statsSection = document.getElementById('stats-section');
const loginForm = document.getElementById('login-form');
const syncTokenInput = document.getElementById('sync-token-input');
const syncStatus = document.getElementById('sync-status');

const currentDomainEl = document.getElementById('current-domain');
const currentDurationEl = document.getElementById('current-duration');

const productiveTimeEl = document.getElementById('productive-time');
const distractingTimeEl = document.getElementById('distracting-time');
const prodScoreVal = document.getElementById('prod-score-val');
const prodScoreBar = document.getElementById('prod-score-bar');

// Focus Timer selectors
const focusTimerDisplay = document.getElementById('focus-timer-display');
const focusSetupDisplay = document.getElementById('focus-setup-display');
const timerDigitsEl = document.getElementById('timer-digits');
const btnStartFocus = document.getElementById('btn-start-focus');
const btnPauseFocus = document.getElementById('btn-pause-focus');
const btnStopFocus = document.getElementById('btn-stop-focus');
const focusPresetSelect = document.getElementById('focus-preset');

// Footer selectors
const btnOpenDashboard = document.getElementById('btn-open-dashboard');
const btnOpenOptions = document.getElementById('btn-open-options');

// Local variables
let userToken = '';
let currentTabStartTime = null;
let currentTabInterval = null;

// On Load init
document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['token', 'focusTimer']);
  
  if (data.token) {
    userToken = data.token;
    syncStatus.textContent = 'Synced';
    syncStatus.classList.add('synced');
    authSection.classList.add('hidden');
    statsSection.classList.remove('hidden');
    fetchTodayStats();
  } else {
    syncStatus.textContent = 'Offline';
    syncStatus.classList.remove('synced');
    authSection.classList.remove('hidden');
    statsSection.classList.add('hidden');
  }

  // Set up active tab trackers
  updateActiveTabDetails();

  // Sync Focus Mode controls view
  if (data.focusTimer) {
    updateFocusTimerUI(data.focusTimer);
  } else {
    chrome.runtime.sendMessage({ type: 'GET_FOCUS_STATE' }, (response) => {
      if (response && response.focusTimer) {
        updateFocusTimerUI(response.focusTimer);
      }
    });
  }
});

// Helper: Format seconds -> minutes
const toMinFormat = (secs) => {
  if (!secs || isNaN(secs)) return '0m';
  const m = Math.floor(secs / 60);
  return `${m}m`;
};

// Helper: Format seconds -> MM:SS
const toMMSS = (secs) => {
  const mins = Math.floor(secs / 60);
  const remainder = secs % 60;
  return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

// Extract domain from URL
const getDomain = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol.startsWith('chrome') || urlObj.protocol.startsWith('edge') || urlObj.protocol.startsWith('about')) {
      return null;
    }
    let host = urlObj.hostname;
    if (host.startsWith('www.')) host = host.substring(4);
    return host;
  } catch (e) {
    return null;
  }
};

// Fetch today's aggregated reports from the backend
const fetchTodayStats = async () => {
  if (!userToken) return;

  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${BACKEND_URL}/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ date: todayStr })
    });

    if (response.ok) {
      const data = await response.json();
      productiveTimeEl.textContent = toMinFormat(data.productiveTime);
      distractingTimeEl.textContent = toMinFormat(data.distractingTime);
      prodScoreVal.textContent = `${data.productivityScore}%`;
      prodScoreBar.style.width = `${data.productivityScore}%`;
    }
  } catch (err) {
    console.error('Failed to fetch stats from server:', err);
    // Fallback calculation using local storage activities queue
    calculateLocalStatsFallback();
  }
};

// Fallback calculations if server is offline
const calculateLocalStatsFallback = async () => {
  const storage = await chrome.storage.local.get(['activities']);
  const queue = storage.activities || [];
  
  let prodSecs = 0;
  let distSecs = 0;

  queue.forEach(act => {
    if (act.category === 'productive') prodSecs += act.duration;
    else if (act.category === 'distracting') distSecs += act.duration;
  });

  productiveTimeEl.textContent = toMinFormat(prodSecs);
  distractingTimeEl.textContent = toMinFormat(distSecs);

  const denom = prodSecs + distSecs;
  const score = denom > 0 ? Math.round((prodSecs / denom) * 100) : 50;
  prodScoreVal.textContent = `${score}%`;
  prodScoreBar.style.width = `${score}%`;
};

// Update active tab label & start a local timer count-up
const updateActiveTabDetails = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const domain = getDomain(tabs[0].url);
      if (domain) {
        currentDomainEl.textContent = domain;
        
        // Fetch start time from background or state
        currentTabStartTime = Date.now();
        clearInterval(currentTabInterval);
        currentTabInterval = setInterval(() => {
          const secs = Math.round((Date.now() - currentTabStartTime) / 1000);
          currentDurationEl.textContent = toMMSS(secs);
        }, 1000);
      } else {
        currentDomainEl.textContent = 'Restricted Page / New Tab';
        currentDurationEl.textContent = '00:00';
        clearInterval(currentTabInterval);
      }
    }
  });
};

// Handle account token sync form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = syncTokenInput.value.trim();
  if (!token) return;

  // Sync token with background
  chrome.runtime.sendMessage({ type: 'LOGIN_SYNC', token }, (response) => {
    if (response && response.success) {
      userToken = token;
      syncStatus.textContent = 'Synced';
      syncStatus.classList.add('synced');
      authSection.classList.add('hidden');
      statsSection.classList.remove('hidden');
      fetchTodayStats();
    }
  });
});

// Start focus session
btnStartFocus.addEventListener('click', () => {
  const duration = parseInt(focusPresetSelect.value);
  chrome.runtime.sendMessage({ type: 'START_FOCUS', duration }, (response) => {
    if (response && response.success) {
      updateFocusTimerUI(response.focusTimer);
    }
  });
});

// Pause / Resume focus session
btnPauseFocus.addEventListener('click', () => {
  const isPauseAction = btnPauseFocus.textContent.toLowerCase() === 'pause';
  const type = isPauseAction ? 'PAUSE_FOCUS' : 'RESUME_FOCUS';
  
  chrome.runtime.sendMessage({ type }, (response) => {
    if (response && response.success) {
      updateFocusTimerUI(response.focusTimer);
    }
  });
});

// Stop focus session
btnStopFocus.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_FOCUS' }, (response) => {
    if (response && response.success) {
      updateFocusTimerUI(response.focusTimer);
    }
  });
});

// Sync timer UI from background state
const updateFocusTimerUI = (timer) => {
  if (timer && timer.isRunning) {
    focusSetupDisplay.classList.add('hidden');
    focusTimerDisplay.classList.remove('hidden');
    timerDigitsEl.textContent = toMMSS(timer.timeLeft);
    btnPauseFocus.textContent = timer.isPaused ? 'Resume' : 'Pause';
    btnPauseFocus.className = timer.isPaused ? 'btn btn-primary' : 'btn btn-secondary';
  } else {
    focusSetupDisplay.classList.remove('hidden');
    focusTimerDisplay.classList.add('hidden');
  }
};

// Monitor storage changes to keep countdown synchronized in real time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.focusTimer) {
    updateFocusTimerUI(changes.focusTimer.newValue);
  }
  if (changes.token) {
    if (changes.token.newValue) {
      userToken = changes.token.newValue;
      syncStatus.textContent = 'Synced';
      syncStatus.classList.add('synced');
      authSection.classList.add('hidden');
      statsSection.classList.remove('hidden');
      fetchTodayStats();
    } else {
      userToken = '';
      syncStatus.textContent = 'Offline';
      syncStatus.classList.remove('synced');
      authSection.classList.remove('hidden');
      statsSection.classList.add('hidden');
    }
  }
});

// Redirections links
btnOpenOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

btnOpenDashboard.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173' });
});
