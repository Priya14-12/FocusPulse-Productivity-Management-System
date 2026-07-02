// SettingsContext.jsx - User Settings & Goals Provider
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { setTheme } = useTheme();
  
  const [settings, setSettings] = useState(null);
  const [blockedSites, setBlockedSites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch settings & blocked sites when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
      loadBlockedSites();
    } else {
      setSettings(null);
      setBlockedSites([]);
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
      if (response.data.theme) {
        setTheme(response.data.theme);
      }
    } catch (err) {
      console.error('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedSites = async () => {
    try {
      const response = await api.get('/blocked-sites');
      setBlockedSites(response.data);
    } catch (err) {
      console.error('Failed to load blocked sites:', err.message);
    }
  };

  const updateSettings = async (updatedFields) => {
    try {
      const response = await api.put('/settings', updatedFields);
      setSettings(response.data);
      if (updatedFields.theme) {
        setTheme(updatedFields.theme);
      }
      return response.data;
    } catch (err) {
      console.error('Failed to update settings:', err.message);
      throw err;
    }
  };

  const addBlockedSite = async (domain) => {
    try {
      const response = await api.post('/blocked-sites', { domain });
      setBlockedSites((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Failed to add blocked site:', err.message);
      throw err;
    }
  };

  const removeBlockedSite = async (id) => {
    try {
      await api.delete(`/blocked-sites/${id}`);
      setBlockedSites((prev) => prev.filter((site) => site._id !== id));
    } catch (err) {
      console.error('Failed to delete blocked site:', err.message);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        blockedSites,
        loading,
        updateSettings,
        addBlockedSite,
        removeBlockedSite,
        refreshSettings: loadSettings,
        refreshBlockedSites: loadBlockedSites
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
