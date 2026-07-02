// BlockedSites.jsx - Blocklist Management Page
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { ShieldAlert, AlertCircle, Plus, Trash2, Info, HelpCircle } from 'lucide-react';

const BlockedSites = () => {
  const { blockedSites, addBlockedSite, removeBlockedSite, loading } = useSettings();
  const [newDomain, setNewDomain] = useState('');
  const [blockError, setBlockError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddBlockedDomain = async (e) => {
    e.preventDefault();
    setBlockError('');
    setSuccessMsg('');

    if (!newDomain.trim()) return;

    try {
      await addBlockedSite(newDomain.trim());
      setSuccessMsg(`Successfully blocked "${newDomain.trim()}"`);
      setNewDomain('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setBlockError(err.response?.data?.message || 'Failed to block domain');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Blocked Websites</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage websites you want to restrict. Restrained domains redirect to the custom blocked block screen.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '30px'
      }}>
        {/* Main Content: Block List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Add domain form */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-distracting)' }} />
              Add Website to Block List
            </h3>

            {blockError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--color-distracting)',
                color: 'var(--color-distracting)',
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={14} />
                <span>{blockError}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid var(--color-productive)',
                color: 'var(--color-productive)',
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAddBlockedDomain} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. facebook.com or instagram.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button type="submit" className="btn btn-danger" style={{ padding: '10px 20px' }} disabled={loading}>
                <Plus size={16} />
                Block Site
              </button>
            </form>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px', display: 'block' }}>
              Tip: Enter hostnames (e.g. facebook.com) rather than full URLs. Subdomains (e.g. m.facebook.com) will be automatically blocked.
            </span>
          </div>

          {/* List of blocked sites */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Currently Blocked Domains</h3>
            
            {blockedSites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>No websites blocked yet.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Use the form above to add a site you want to block.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {blockedSites.map((site) => (
                  <div key={site._id} style={{
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all var(--transition-fast)'
                  }} className="blocked-site-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {site.domain}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={12} />
                        Blocked attempts: <strong>{site.blockedAttempts || 0}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => removeBlockedSite(site._id)}
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-distracting)';
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Unblock website"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel: Help & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={16} style={{ color: 'var(--color-brand)' }} />
              How Site Blocking Works
            </h4>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: 1.6 }}>
              <p>
                1. <strong>Synchronized Settings:</strong> Any domain added here will be saved on our cloud servers and synced in real-time to your Chrome Extension on any device.
              </p>
              <p>
                2. <strong>Redirection screen:</strong> When you navigate to a blocked domain, the Chrome Extension intercepts the navigation request and redirects you to a beautiful custom screen reminding you to stay focused.
              </p>
              <p>
                3. <strong>Focus Mode:</strong> When you start a Focus Timer block, the system automatically blocks <strong>ALL distracting domains</strong> in addition to your custom blocked sites.
              </p>
              <p>
                4. <strong>Blocked Attempts Tracker:</strong> Each time you try to access a blocked website, the extension increments the block count, letting you review your progress and habits over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedSites;
