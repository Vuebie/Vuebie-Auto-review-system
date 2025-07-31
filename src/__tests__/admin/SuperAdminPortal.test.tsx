import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import SuperAdminPortal from '../../pages/superadmin/SuperAdminPortal';
import { AuthProvider } from '../../contexts/AuthContext';
import i18n from '../../i18n';

// Mock Supabase
jest.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [
            { id: '1', status: 'active', created_at: '2024-01-01' },
            { id: '2', status: 'inactive', created_at: '2024-01-02' }
          ],
          error: null
        }))
      }))
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    }
  },
  TABLES: {
    MERCHANT_PROFILES: 'merchant_profiles',
    SECURITY_EVENTS: 'security_events'
  }
}));

// Mock AuthContext with super_admin user
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test.superadmin@vuebie.com',
      role: 'super_admin'
    },
    loading: false,
    hasSuperAdminRole: true,
    hasAdminRole: true
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('SuperAdminPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders super admin dashboard', async () => {
    renderWithProviders(<SuperAdminPortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/super admin portal/i)).toBeInTheDocument();
    });
  });

  test('displays merchant statistics', async () => {
    renderWithProviders(<SuperAdminPortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/total merchants/i)).toBeInTheDocument();
      expect(screen.getByText(/active merchants/i)).toBeInTheDocument();
    });
  });

  test('displays security events section', async () => {
    renderWithProviders(<SuperAdminPortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/security events/i)).toBeInTheDocument();
    });
  });

  test('shows system metrics', async () => {
    renderWithProviders(<SuperAdminPortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/api response time/i)).toBeInTheDocument();
      expect(screen.getByText(/database usage/i)).toBeInTheDocument();
    });
  });
});