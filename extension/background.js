// background.js - Chrome Extension Service Worker

const BACKEND_URL = 'http://localhost:5000/api';
let activeTabId = null;
let activeDomain = null;
let activeStartTime = null;
let activitiesQueue = [];

// Categories mappings
const DEFAULT_CATEGORIES = {
  // Productive
  'github.com': 'productive',
  'stackoverflow.com': 'productive',
  'leetcode.com': 'productive',
  'chatgpt.com': 'productive',
  'docs.google.com': 'productive',
  // Neutral
  'google.com': 'neutral',
  'gmail.com': 'neutral',
  // Distracting
  'youtube.com': 'distracting',
  'instagram.com': 'distracting',
  'facebook.com': 'distracting',
  'x.com': 'distracting',
  'reddit.com': 'distracting'
};

// Focus Timer State
let focusTimer = {
  duration: 0,
  timeLeft: 0,
  isRunning: false,
  isPaused: false,
  startTime: null
};

// Blocked sites list
let blockedDomains = [];
let userToken = '';

// Initialize Extension Settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    activities: [],
    blockedDomains: [],
    token: '',
    focusTimer: { isRunning: false }
  });
  
  // Set up periodic upload alarm (runs every 1 minute)
  chrome.alarms.create('sync_activities', { periodInMinutes: 1 });
});

// Load stored settings on start
const loadStorageData = async () => {
  const data = await chrome.storage.local.get(['token', 'blockedDomains']);
  if (data.token) userToken = data.token;
  if (data.blockedDomains) blockedDomains = data.blockedDomains;
};
loadStorageData();

// Helper: Extract domain from URL
const getDomain = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    // Ignore chrome://, edge://, extension URLs
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

// Helper: Determine domain category
const getCategory = (domain) => {
  if (!domain) return 'neutral';
  // Check default categories first
  if (DEFAULT_CATEGORIES[domain]) return DEFAULT_CATEGORIES[domain];
  
  // Subdomain matching (e.g. docs.google.com matches google.com)
  for (const [key, value] of Object.entries(DEFAULT_CATEGORIES)) {
    if (domain.endsWith('.' + key)) return value;
  }
  return 'neutral';
};

// Track time spent on the active website
const stopCurrentTimer = () => {
  if (activeDomain && activeStartTime) {
    const duration = Math.round((Date.now() - activeStartTime) / 1000);
    if (duration > 0) {
      const activity = {
        domain: activeDomain,
        startTime: new Date(activeStartTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: duration,
        category: getCategory(activeDomain)
      };
      
      activitiesQueue.push(activity);
      saveQueueToStorage();
    }
  }
  activeDomain = null;
  activeStartTime = null;
};

const startNewTimer = (domain) => {
  if (domain) {
    activeDomain = domain;
    activeStartTime = Date.now();
  }
};

const saveQueueToStorage = () => {
  chrome.storage.local.set({ activities: activitiesQueue });
};

// Handle tab focus changes
const handleTabSelection = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs && tabs[0]) {
    const tab = tabs[0];
    const domain = getDomain(tab.url);

    // Check if domain is blocked
    if (domain && isDomainBlocked(domain)) {
      redirectBlockedTab(tab.id, tab.url);
      return;
    }

    if (domain !== activeDomain) {
      stopCurrentTimer();
      startNewTimer(domain);
    }
  } else {
    stopCurrentTimer();
  }
};

// Intercept window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopCurrentTimer();
  } else {
    handleTabSelection();
  }
});

// Intercept tab activation changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
  handleTabSelection();
});

// Intercept tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    const domain = getDomain(changeInfo.url);
    
    if (domain && isDomainBlocked(domain)) {
      redirectBlockedTab(tabId, changeInfo.url);
      return;
    }

    if (domain !== activeDomain) {
      stopCurrentTimer();
      startNewTimer(domain);
    }
  }
});

// Intercept navigation to enforce blocked sites
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Top level navigation only
    const domain = getDomain(details.url);
    if (domain && isDomainBlocked(domain)) {
      redirectBlockedTab(details.tabId, details.url);
    }
  }
});

// Check if a domain is blocked
const isDomainBlocked = (domain) => {
  if (!domain) return false;
  
  // Under focus mode, automatically block all distracting sites
  if (focusTimer.isRunning && !focusTimer.isPaused) {
    if (getCategory(domain) === 'distracting') {
      return true;
    }
  }

  // Check user custom blocked sites
  return blockedDomains.some(blocked => {
    return domain === blocked || domain.endsWith('.' + blocked);
  });
};

// Redirect tab to blocked page
const redirectBlockedTab = (tabId, originalUrl) => {
  const blockedUrl = chrome.runtime.getURL(`blocked/blocked.html?url=${encodeURIComponent(originalUrl)}`);
  chrome.tabs.update(tabId, { url: blockedUrl });
  
  // Record attempt in database if logged in
  if (userToken) {
    const domain = getDomain(originalUrl);
    fetch(`${BACKEND_URL}/blocked-sites/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ domain })
    }).catch(err => console.error('Failed to log blocked attempt:', err));
  }
};

// Periodic Sync Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync_activities') {
    syncActivitiesWithBackend();
  }
});

// Send queue to database
const syncActivitiesWithBackend = async () => {
  const storage = await chrome.storage.local.get(['activities', 'token']);
  const token = storage.token || userToken;
  const queue = storage.activities || activitiesQueue;

  if (!token || queue.length === 0) return;

  try {
    const response = await fetch(`${BACKEND_URL}/activities/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ activities: queue })
    });

    if (response.ok) {
      activitiesQueue = [];
      saveQueueToStorage();
    }
  } catch (err) {
    console.error('Failed to sync activities with backend:', err);
  }
};

// Focus Countdown Interval Timer
let focusInterval = null;
const startFocusTimer = (mins) => {
  clearInterval(focusInterval);
  focusTimer = {
    duration: mins * 60,
    timeLeft: mins * 60,
    isRunning: true,
    isPaused: false,
    startTime: new Date().toISOString()
  };
  chrome.storage.local.set({ focusTimer });

  // Enforce blocks on active tab immediately
  handleTabSelection();

  focusInterval = setInterval(() => {
    if (focusTimer.isRunning && !focusTimer.isPaused) {
      focusTimer.timeLeft--;
      
      if (focusTimer.timeLeft <= 0) {
        clearInterval(focusInterval);
        completeFocusSession();
      } else {
        chrome.storage.local.set({ focusTimer });
      }
    }
  }, 1000);
};

const completeFocusSession = async () => {
  focusTimer.isRunning = false;
  chrome.storage.local.set({ focusTimer });

  // Display finished notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Focus Session Finished!',
    message: 'Awesome work! Your focus session is complete. Take a break.',
    priority: 2
  });

  // Log session to backend
  if (userToken) {
    try {
      await fetch(`${BACKEND_URL}/focus-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          startTime: focusTimer.startTime,
          endTime: new Date().toISOString(),
          duration: focusTimer.duration,
          completed: true
        })
      });
      // Also generate report for today
      const todayStr = new Date().toISOString().split('T')[0];
      await fetch(`${BACKEND_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ date: todayStr })
      });
    } catch (e) {
      console.error('Failed to save focus session:', e);
    }
  }
};

// Message Handler from Popup/Options panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_FOCUS') {
    startFocusTimer(message.duration);
    sendResponse({ success: true, focusTimer });
  } 
  else if (message.type === 'PAUSE_FOCUS') {
    focusTimer.isPaused = true;
    chrome.storage.local.set({ focusTimer });
    sendResponse({ success: true, focusTimer });
  } 
  else if (message.type === 'RESUME_FOCUS') {
    focusTimer.isPaused = false;
    chrome.storage.local.set({ focusTimer });
    sendResponse({ success: true, focusTimer });
  } 
  else if (message.type === 'STOP_FOCUS') {
    clearInterval(focusInterval);
    focusTimer = { isRunning: false, isPaused: false, duration: 0, timeLeft: 0 };
    chrome.storage.local.set({ focusTimer });
    sendResponse({ success: true, focusTimer });
  } 
  else if (message.type === 'GET_FOCUS_STATE') {
    sendResponse({ focusTimer });
  } 
  else if (message.type === 'LOGIN_SYNC') {
    userToken = message.token;
    chrome.storage.local.set({ token: message.token });
    syncSettingsAndBlocklist();
    sendResponse({ success: true });
  }
  else if (message.type === 'SYNC_SETTINGS') {
    syncSettingsAndBlocklist();
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

// Sync user settings and blocklist from server
const syncSettingsAndBlocklist = async () => {
  const storage = await chrome.storage.local.get(['token']);
  const token = storage.token || userToken;
  if (!token) return;

  try {
    // 1. Get Blocked Sites
    const blockRes = await fetch(`${BACKEND_URL}/blocked-sites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (blockRes.ok) {
      const sites = await blockRes.json();
      blockedDomains = sites.map(site => site.domain);
      chrome.storage.local.set({ blockedDomains });
    }

    // 2. Sync queued activities
    syncActivitiesWithBackend();
  } catch (err) {
    console.error('Failed to sync settings from server:', err);
  }
};
