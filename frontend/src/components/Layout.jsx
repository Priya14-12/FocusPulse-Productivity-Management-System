// Layout.jsx - Sidebar and Header Wrapper
import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText,
  Timer, 
  ShieldAlert,
  Settings as SettingsIcon, 
  LogOut, 
  Sun, 
  Moon,
  Activity
} from 'lucide-react';

const Layout = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Focus Timer', path: '/focus', icon: Timer },
    { name: 'Blocked Sites', path: '/blocked-sites', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar navigation */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        padding: '24px 16px'
      }}>
        {/* Brand/Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 8px 32px 8px',
          borderBottom: '1px solid var(--card-border)',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-brand-glow)',
            color: 'var(--color-brand)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={24} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.03em'
          }}>
            FocusPulse
          </span>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-display)',
                  color: isActive ? 'var(--color-brand)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--color-brand-glow)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls (Theme and Logout) */}
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* User Badge */}
          {user && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0 8px'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Logged in as</span>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.email}
              </span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--card-border)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'var(--font-display)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              Theme: {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--border-radius-sm)',
              border: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--color-distracting)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-display)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main page content area */}
      <div className="dashboard-content">
        {/* Top Header */}
        <header style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {menuItems.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--card-border)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-productive)',
                display: 'inline-block'
              }}></span>
              Cloud Synced
            </div>
          </div>
        </header>

        {/* Viewport Router Outlet */}
        <main className="main-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
