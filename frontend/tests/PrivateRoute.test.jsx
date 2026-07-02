// PrivateRoute.test.jsx - Frontend Router Auth Guard Tests
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../src/components/PrivateRoute';
import { useAuth } from '../src/context/AuthContext';

jest.mock('../src/context/AuthContext', () => {
  const originalModule = jest.requireActual('../src/context/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

describe('PrivateRoute Guard', () => {
  it('renders loading verification screen during initialization state', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(screen.getByText('Verifying credentials...')).toBeInTheDocument();
  });

  it('renders protected child component if authenticated successfully', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/protected" element={<div>Protected Dashboard Workspace</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Dashboard Workspace')).toBeInTheDocument();
  });

  it('redirects to login path if unauthenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/protected" element={<div>Protected Dashboard Workspace</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Redirected</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Dashboard Workspace')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Redirected')).toBeInTheDocument();
  });
});
