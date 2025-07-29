import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionMonitoringDashboard } from '../../../components/monitoring';
import { supabase } from '../../../lib/supabase';

// Mock the supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: jest.fn(),
  },
}));

// Mock data for testing
const mockCacheData = [
  { timestamp: '2025-07-25T10:00:00Z', hits: 250, misses: 50 },
  { timestamp: '2025-07-25T11:00:00Z', hits: 300, misses: 45 },
];

const mockChecksData = [
  { timestamp: '2025-07-25T10:00:00Z', successful: 180, denied: 20, avg_latency: 12.5 },
  { timestamp: '2025-07-25T11:00:00Z', successful: 200, denied: 15, avg_latency: 10.2 },
];

const mockRoleData = [
  { timestamp: '2025-07-25T10:00:00Z', assignments: 5, removals: 2 },
  { timestamp: '2025-07-25T11:00:00Z', assignments: 8, removals: 3 },
];

const mockSecurityData = [
  { timestamp: '2025-07-25T10:00:00Z', unauthorized_attempts: 3, type: 'access_denied' },
  { timestamp: '2025-07-25T11:00:00Z', unauthorized_attempts: 1, type: 'invalid_token' },
];

const mockEdgeData = [
  { timestamp: '2025-07-25T10:00:00Z', calls: 150, errors: 5, latency: 85.2 },
  { timestamp: '2025-07-25T11:00:00Z', calls: 180, errors: 3, latency: 82.7 },
];

const mockAlertsData = [
  { 
    id: '1', 
    severity: 'high', 
    message: 'Multiple unauthorized access attempts detected', 
    timestamp: '2025-07-25T10:05:00Z',
    acknowledged: false
  },
  { 
    id: '2', 
    severity: 'medium', 
    message: 'Cache hit rate below threshold', 
    timestamp: '2025-07-25T09:30:00Z',
    acknowledged: true
  },
];

describe('PermissionMonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Promise.all implementation for the data fetching
    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
      let mockData;
      
      switch(tableName) {
        case 'permission_metrics_cache':
          mockData = { data: mockCacheData, error: null };
          break;
        case 'permission_metrics_checks':
          mockData = { data: mockChecksData, error: null };
          break;
        case 'permission_metrics_roles':
          mockData = { data: mockRoleData, error: null };
          break;
        case 'permission_metrics_security':
          mockData = { data: mockSecurityData, error: null };
          break;
        case 'permission_metrics_edge':
          mockData = { data: mockEdgeData, error: null };
          break;
        case 'permission_metrics_alerts':
          mockData = { data: mockAlertsData, error: null };
          break;
        default:
          mockData = { data: [], error: null };
      }
      
      return {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockImplementation(() => {
          return Promise.resolve(mockData);
        }),
      };
    });
  });

  test('renders loading state initially', () => {
    render(<PermissionMonitoringDashboard />);
    expect(screen.getByRole('heading', { name: /permission monitoring dashboard/i })).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('renders dashboard with metrics data after loading', async () => {
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the loading state to finish
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Check for summary cards
    expect(screen.getByText(/cache performance/i)).toBeInTheDocument();
    expect(screen.getByText(/permission checks/i)).toBeInTheDocument();
    expect(screen.getByText(/role management/i)).toBeInTheDocument();
    expect(screen.getByText(/security events/i)).toBeInTheDocument();
    expect(screen.getByText(/edge functions/i)).toBeInTheDocument();
    
    // Check for tab navigation
    expect(screen.getByRole('tab', { name: /cache performance/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /permission checks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /role management/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /security events/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /edge functions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /alerts/i })).toBeInTheDocument();
  });

  test('changes time range when user selects different option', async () => {
    const user = userEvent.setup();
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the loading state to finish
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Click on the select dropdown
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    
    // Click on "Last 7 Days" option
    const option = screen.getByRole('option', { name: /last 7 days/i });
    await user.click(option);
    
    // Verify that supabase.from was called again with the new time range
    expect(supabase.from).toHaveBeenCalledWith('permission_metrics_cache');
    expect(supabase.from).toHaveBeenCalledWith('permission_metrics_checks');
  });

  test('clicking on a tab changes the displayed content', async () => {
    const user = userEvent.setup();
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the loading state to finish
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Initially, the Cache Performance tab should be active
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-state', 'active');
    
    // Click on the Alerts tab
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    await user.click(alertsTab);
    
    // Now the Alerts panel should be visible
    await waitFor(() => {
      const tabpanels = screen.getAllByRole('tabpanel');
      const activeTabPanel = tabpanels.find(panel => panel.getAttribute('data-state') === 'active');
      expect(activeTabPanel).toHaveTextContent(/security alerts/i);
    });
  });

  test('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the loading state to finish
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Clear the mock calls
    jest.clearAllMocks();
    
    // Click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Verify that supabase.from was called again to refresh the data
    expect(supabase.from).toHaveBeenCalledWith('permission_metrics_cache');
    expect(supabase.from).toHaveBeenCalledWith('permission_metrics_checks');
  });
});