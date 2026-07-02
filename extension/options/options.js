// options.js - Extension Options Controller

const BACKEND_URL = 'http://localhost:5000/api';

// DOM Selectors
const tokenForm = document.getElementById('token-form');
const tokenInput = document.getElementById('token-input');
const btnDisconnect = document.getElementById('btn-disconnect');
const syncBadge = document.getElementById('sync-badge');

const settingsSection = document.getElementById('settings-section');
const settingsForm = document.getElementById('settings-form');
const goalProductive = document.getElementById('goal-productive');
const goalDistracting = document.getElementById('goal-distracting');
const goalFocus = document.getElementById('goal-focus');
const focusDurationSelect = document.getElementById('focus-duration');
const notifyEnabledCheck = document.getElementById('notify-enabled');
const themePreferenceSelect = document.getElementById('theme-preference');

const blocklistSection = document.getElementById('blocklist-section');
const addBlockForm = document.getElementById('add-block-form');
const blockDomainInput = document.getElementById('block-domain-input');
const blockListContainer = document.getElementById('block-list-container');

// Local States
let userToken = '';
let blockedSites = [];

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['token']);
  
  if (data.token) {
    userToken = data.token;
    initializeConnectedState();
  } else {
    initializeDisconnectedState();
  }
});

const initializeConnectedState = async () => {
  syncBadge.textContent = 'Connected';
  syncBadge.className = 'sync-badge connected';
  tokenInput.disabled = true;
  tokenInput.value = '••••••••••••••••••••••••••••••••';
  tokenForm.querySelector('button[type="submit"]').classList.add('hidden');
  btnDisconnect.classList.remove('hidden');
  
  // Enable configuration panels
  settingsSection.classList.remove('disabled-section');
  blocklistSection.classList.remove('disabled-section');
  
  // Fetch configurations
  fetchPreferences();
  fetchBlockedSites();
};

const initializeDisconnectedState = () => {
  syncBadge.textContent = 'Disconnected';
  syncBadge.className = 'sync-badge';
  tokenInput.disabled = false;
  tokenInput.value = '';
  tokenForm.querySelector('button[type="submit"]').classList.remove('hidden');
  btnDisconnect.classList.add('hidden');

  // Disable panels
  settingsSection.classList.add('disabled-section');
  blocklistSection.classList.add('disabled-section');
  blockListContainer.innerHTML = '<div class="empty-state">No blocked websites. Connect account to start.</div>';
};

// Fetch preferences from MERN database
const fetchPreferences = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/settings`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      goalProductive.value = data.dailyGoalProductive / 3600;
      goalDistracting.value = data.dailyGoalDistracting / 3600;
      goalFocus.value = data.dailyGoalFocusSessions;
      focusDurationSelect.value = data.focusDuration;
      notifyEnabledCheck.checked = data.notificationsEnabled;
      themePreferenceSelect.value = data.theme;
    }
  } catch (err) {
    console.error('Failed to fetch settings:', err);
  }
};

// Fetch blocked websites from database
const fetchBlockedSites = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/blocked-sites`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (response.ok) {
      blockedSites = await response.json();
      renderBlockedSites();
      
      // Update background worker list
      const domains = blockedSites.map(s => s.domain);
      chrome.storage.local.set({ blockedDomains: domains });
    }
  } catch (err) {
    console.error('Failed to fetch blocked sites:', err);
  }
};

// Render block list items
const renderBlockedSites = () => {
  if (blockedSites.length === 0) {
    blockListContainer.innerHTML = '<div class="empty-state">No blocked websites. You are safe!</div>';
    return;
  }

  blockListContainer.innerHTML = blockedSites.map(site => `
    <div class="block-item">
      <div style="display: flex; flex-direction: column;">
        <span class="block-domain">${site.domain}</span>
        <span style="font-size: 11px; color: var(--text-secondary);">Blocked Hits: ${site.blockedAttempts}</span>
      </div>
      <button class="btn-delete" data-id="${site._id}">Remove</button>
    </div>
  `).join('');

  // Register deletion handlers
  blockListContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteBlockedSite(id);
    });
  });
};

// Handle token syncing
tokenForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) return;

  chrome.runtime.sendMessage({ type: 'LOGIN_SYNC', token }, (response) => {
    if (response && response.success) {
      userToken = token;
      initializeConnectedState();
    }
  });
});

// Handle account disconnection
btnDisconnect.addEventListener('click', () => {
  chrome.storage.local.set({ token: '', blockedDomains: [] });
  userToken = '';
  initializeDisconnectedState();
});

// Handle settings form submit
settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const settingsPayload = {
    dailyGoalProductive: parseInt(goalProductive.value) * 3600,
    dailyGoalDistracting: parseInt(goalDistracting.value) * 3600,
    dailyGoalFocusSessions: parseInt(goalFocus.value),
    focusDuration: parseInt(focusDurationSelect.value),
    notificationsEnabled: notifyEnabledCheck.checked,
    theme: themePreferenceSelect.value
  };

  try {
    const response = await fetch(`${BACKEND_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(settingsPayload)
    });

    if (response.ok) {
      alert('Preferences saved and synced!');
      chrome.runtime.sendMessage({ type: 'SYNC_SETTINGS' });
    } else {
      alert('Failed to save settings.');
    }
  } catch (err) {
    console.error(err);
    alert('Network error. Failed to save settings.');
  }
});

// Handle custom domain additions
addBlockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = blockDomainInput.value.trim();
  if (!domain) return;

  try {
    const response = await fetch(`${BACKEND_URL}/blocked-sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ domain })
    });

    if (response.ok) {
      blockDomainInput.value = '';
      fetchBlockedSites();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to block domain');
    }
  } catch (err) {
    console.error(err);
    alert('Error. Failed to block domain.');
  }
});

// Delete blocked domain
const deleteBlockedSite = async (id) => {
  try {
    const response = await fetch(`${BACKEND_URL}/blocked-sites/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (response.ok) {
      fetchBlockedSites();
    } else {
      alert('Failed to remove domain block');
    }
  } catch (err) {
    console.error(err);
  }
};
