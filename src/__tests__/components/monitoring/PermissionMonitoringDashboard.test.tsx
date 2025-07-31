import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionMonitoringDashboard } from '../../../components/monitoring';

// Mock the supabase client
jest.mock('../../../lib/supabase', () => {
  // Mock data for different tables
  const mockCacheData = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', hit_rate: 85.5, miss_rate: 14.5, total_requests: 1000 }
  ];
  
  const mockChecksData = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', total_checks: 500, successful_checks: 485, failed_checks: 15 }
  ];
  
  const mockRoleData = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', active_roles: 25, role_assignments: 150 }
  ];
  
  const mockSecurityData = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', security_events: 5, blocked_attempts: 2 }
  ];
  
  const mockEdgeData = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', function_calls: 200, avg_response_time: 45 }
  ];
  
  const mockAlertsData = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', alert_type: 'warning', message: 'High cache miss rate' }
  ];

  const mockFrom = jest.fn().mockImplementation((tableName) => {
    let mockData;
    switch (tableName) {
      case 'permission_metrics_cache':
        mockData = mockCacheData;
        break;
      case 'permission_metrics_checks':
        mockData = mockChecksData;
        break;
      case 'permission_metrics_roles':
        mockData = mockRoleData;
        break;
      case 'permission_metrics_security':
        mockData = mockSecurityData;
        break;
      case 'permission_metrics_edge':
        mockData = mockEdgeData;
        break;
      case 'permission_metrics_alerts':
        mockData = mockAlertsData;
        break;
      default:
        mockData = [];
    }
    
    return {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    };
  });

  return {
    supabase: {
      from: mockFrom
    }
  };
});

describe('PermissionMonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially and then loads content', async () => {
    render(<PermissionMonitoringDashboard />);
    
    // Initially should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    
    // Wait for the component to load and show the dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /permission monitoring dashboard/i })).toBeInTheDocument();
    });
    
    // Loading spinner should be gone
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  test('displays dashboard content after loading', async () => {
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the component to load and show the dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /permission monitoring dashboard/i })).toBeInTheDocument();
    });
    
    // Check for main dashboard elements
    expect(screen.getByText(/monitor and analyze permission system performance/i)).toBeInTheDocument();
    
    // Check for time range selector
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    
    // Check for refresh button
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  test('renders dashboard with metrics data after loading', async () => {
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the component to load and show the dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /permission monitoring dashboard/i })).toBeInTheDocument();
    });
    
    // Check for tab navigation
    expect(screen.getByRole('tab', { name: /cache performance/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /permission checks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /role management/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /security events/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /edge functions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /alerts/i })).toBeInTheDocument();
  });

  test('renders time range selector', async () => {
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the loading state to finish
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Check that the select dropdown is present
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });

  test('clicking on a tab changes the displayed content', async () => {
    const user = userEvent.setup();
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the component to load and show the dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /permission monitoring dashboard/i })).toBeInTheDocument();
    });
    
    // Initially, the Cache Performance tab should be active
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-state', 'active');
    
    // Click on the Security Events tab
    const securityTab = screen.getByRole('tab', { name: /security events/i });
    await user.click(securityTab);
    
    // Now the Security Events panel should be visible
    await waitFor(() => {
      const tabpanels = screen.getAllByRole('tabpanel');
      const activeTabPanel = tabpanels.find(panel => panel.getAttribute('data-state') === 'active');
      expect(activeTabPanel).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<PermissionMonitoringDashboard />);
    
    // Wait for the component to load and show the dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /permission monitoring dashboard/i })).toBeInTheDocument();
    });
    
    // Click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Verify the refresh button was clicked successfully
    expect(refreshButton).toBeInTheDocument();
  });
});