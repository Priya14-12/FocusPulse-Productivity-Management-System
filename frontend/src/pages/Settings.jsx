// Settings.jsx - Dashboard Settings and Goals Management
import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Settings as SettingsIcon, AlertCircle, Info, RefreshCw, Key, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const { settings, updateSettings, loading, refreshSettings } = useSettings();

  // Core preferences states
  const [productiveHrs, setProductiveHrs] = useState(4);
  const [distractingHrs, setDistractingHrs] = useState(1);
  const [focusGoal, setFocusGoal] = useState(3);
  const [defaultFocusDuration, setDefaultFocusDuration] = useState(25);
  const [notifications, setNotifications] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');

  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Sync settings state on load
  useEffect(() => {
    if (settings) {
      setProductiveHrs(settings.dailyGoalProductive / 3600);
      setDistractingHrs(settings.dailyGoalDistracting / 3600);
      setFocusGoal(settings.dailyGoalFocusSessions);
      setDefaultFocusDuration(settings.focusDuration);
      setNotifications(settings.notificationsEnabled);
      setThemeMode(settings.theme);
    }
  }, [settings]);

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');
    
    try {
      await updateSettings({
        dailyGoalProductive: productiveHrs * 3600,
        dailyGoalDistracting: distractingHrs * 3600,
        dailyGoalFocusSessions: focusGoal,
        focusDuration: defaultFocusDuration,
        notificationsEnabled: notifications,
        theme: themeMode
      });
      setSaveSuccess('Preferences and targets updated successfully.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update preferences');
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '30px'
    }}>
      {/* Preferences & Goals Form Column */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={18} style={{ color: 'var(--color-brand)' }} />
          Productivity Settings & Goals
        </h3>

        {saveSuccess && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid var(--color-productive)',
            color: 'var(--color-productive)',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            {saveSuccess}
          </div>
        )}

        {saveError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--color-distracting)',
            color: 'var(--color-distracting)',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={14} />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handlePreferencesSubmit}>
          {/* Daily Goals */}
          <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '14px', fontWeight: 600 }}>Daily Productivity Targets</h4>
            
            <div className="form-group">
              <label className="form-label">Daily Productive Target (Hours)</label>
              <input
                type="number"
                min="1"
                max="24"
                className="form-input"
                value={productiveHrs}
                onChange={(e) => setProductiveHrs(Number(e.target.value))}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Target duration for work/study websites</span>
            </div>

            <div className="form-group">
              <label className="form-label">Daily Distracting Limit (Hours)</label>
              <input
                type="number"
                min="0"
                max="24"
                className="form-input"
                value={distractingHrs}
                onChange={(e) => setDistractingHrs(Number(e.target.value))}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Capping limit for entertainment/social websites</span>
            </div>

            <div className="form-group">
              <label className="form-label">Daily Focus Sessions Target</label>
              <input
                type="number"
                min="1"
                max="10"
                className="form-input"
                value={focusGoal}
                onChange={(e) => setFocusGoal(Number(e.target.value))}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Number of focus block intervals you aim to complete</span>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '14px', fontWeight: 600 }}>Timer & Notification Preferences</h4>
            
            <div className="form-group">
              <label className="form-label">Default Focus Session Duration</label>
              <select
                className="form-input"
                value={defaultFocusDuration}
                onChange={(e) => setDefaultFocusDuration(Number(e.target.value))}
              >
                <option value="25">25 minutes (Recommended)</option>
                <option value="50">50 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
              <input
                type="checkbox"
                id="notify-toggle"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="notify-toggle" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                Enable Browser Notifications for focus timers
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Visual Theme</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['light', 'dark'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setThemeMode(t)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--card-border)',
                      backgroundColor: themeMode === t ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                      color: themeMode === t ? '#ffffff' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {t} Mode
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }} disabled={loading}>
            Save Preferences
          </button>
        </form>
      </div>

      {/* Info Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* User Account Info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} style={{ color: 'var(--color-brand)' }} />
            Account Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Email Address</span>
              <strong style={{ fontSize: '14px' }}>{user?.email || 'user@example.com'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>User ID</span>
              <code style={{ fontSize: '11px', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                {user?.id || user?._id || '507f1f77bcf86cd799439011'}
              </code>
            </div>
          </div>
        </div>

        {/* Extension Token Key Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--color-neutral)' }} />
            Chrome Extension Setup
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', lineHeight: 1.5 }}>
            <p>
              To synchronize your browsing habits and block list with this cloud account, link your Chrome extension:
            </p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Copy your secure JWT authorization token below.</li>
              <li>Click the <strong>FocusPulse</strong> extension icon in your browser toolbar.</li>
              <li>Paste the token into the connection field and click <strong>Connect</strong>.</li>
            </ol>
            <div style={{ marginTop: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Your Authorization Token</span>
              <textarea
                readOnly
                value={localStorage.getItem('token') || ''}
                style={{
                  width: '100%',
                  height: '80px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  padding: '8px',
                  resize: 'none',
                  outline: 'none'
                }}
                onClick={(e) => {
                  e.target.select();
                  document.execCommand('copy');
                  alert('Token copied to clipboard!');
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                Click inside the box to copy your token automatically. Keep this token private.
              </span>
            </div>
          </div>
        </div>

        {/* Sync Info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} style={{ color: 'var(--color-brand)' }} />
            Automatic Cloud Sync
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Preferences are saved instantly on MongoDB Atlas. Focus mode configurations, targets, and goals are automatically synced down to the browser extension background engine, ensuring consistent redirection across your active workspace.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
