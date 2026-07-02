// BlockedSites.test.jsx - Frontend Blocked Sites Page Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BlockedSites from '../src/pages/BlockedSites';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';

// Mock the useSettings hook
jest.mock('../src/context/SettingsContext', () => {
  const originalModule = jest.requireActual('../src/context/SettingsContext');
  return {
    ...originalModule,
    useSettings: jest.fn()
  };
});

describe('BlockedSites Component', () => {
  let mockAddBlockedSite;
  let mockRemoveBlockedSite;
  let mockBlockedSites;

  beforeEach(() => {
    mockAddBlockedSite = jest.fn();
    mockRemoveBlockedSite = jest.fn();
    mockBlockedSites = [
      { _id: '1', domain: 'facebook.com', blockedAttempts: 15 },
      { _id: '2', domain: 'instagram.com', blockedAttempts: 4 }
    ];

    useSettings.mockReturnValue({
      blockedSites: mockBlockedSites,
      addBlockedSite: mockAddBlockedSite,
      removeBlockedSite: mockRemoveBlockedSite,
      loading: false
    });
  });

  it('renders blocked site form and lists active blocked domains', () => {
    render(
      <MemoryRouter>
        <BlockedSites />
      </MemoryRouter>
    );

    // Verify header and form elements
    expect(screen.getByPlaceholderText('e.g. facebook.com or instagram.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /block site/i })).toBeInTheDocument();

    // Verify listed blocked websites and hits
    expect(screen.getByText('facebook.com')).toBeInTheDocument();
    expect(screen.getByText('instagram.com')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('calls addBlockedSite when a valid domain is entered and form is submitted', async () => {
    render(
      <MemoryRouter>
        <BlockedSites />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('e.g. facebook.com or instagram.com');
    const submitBtn = screen.getByRole('button', { name: /block site/i });

    fireEvent.change(input, { target: { value: 'tiktok.com' } });
    fireEvent.click(submitBtn);

    expect(mockAddBlockedSite).toHaveBeenCalledWith('tiktok.com');
  });

  it('calls removeBlockedSite when unblock button is clicked', () => {
    render(
      <MemoryRouter>
        <BlockedSites />
      </MemoryRouter>
    );

    const deleteButtons = screen.getAllByRole('button');
    // The first button in the page is the "Block Site" submit button.
    // The subsequent buttons are the trash/delete buttons for each blocked site.
    
    // Let's click the delete button for facebook.com (first row item)
    fireEvent.click(deleteButtons[1]); // Index 0 is "Block Site", Index 1 is first delete button

    expect(mockRemoveBlockedSite).toHaveBeenCalledWith('1');
  });

  it('does not call addBlockedSite if form is submitted with blank input', () => {
    render(
      <MemoryRouter>
        <BlockedSites />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /block site/i });
    fireEvent.click(submitBtn);

    expect(mockAddBlockedSite).not.toHaveBeenCalled();
  });
});
