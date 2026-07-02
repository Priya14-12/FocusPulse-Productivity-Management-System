// Login.test.jsx - Frontend Login Page Component Tests
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// Mock the useAuth hook
jest.mock('../src/context/AuthContext', () => {
  const originalModule = jest.requireActual('../src/context/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

describe('Login Component', () => {
  let mockLogin;

  beforeEach(() => {
    mockLogin = jest.fn();
    useAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      loading: false
    });
  });

  it('renders login form items correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error warning if form submitted with blank inputs', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls auth login function when form is filled and submitted', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123');
  });

  it('shows server authentication error alerts', () => {
    useAuth.mockReturnValue({
      login: mockLogin,
      error: 'Invalid email or password',
      loading: false
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });
});
