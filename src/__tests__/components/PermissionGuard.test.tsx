import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../components/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';

// Mock Auth Context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('PermissionGuard', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has permission', async () => {
    // Mock Auth Context
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      checkPermission: jest.fn().mockResolvedValue(true),
      hasPermission: jest.fn().mockReturnValue(true)
    });
    
    render(
      <PermissionGuard resource="users" action="read">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for the permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Should render the children
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should render fallback when user does not have permission', async () => {
    // Mock Auth Context
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      checkPermission: jest.fn().mockResolvedValue(false),
      hasPermission: jest.fn().mockReturnValue(false)
    });
    
    render(
      <PermissionGuard 
        resource="users"
        action="delete"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for the permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
    
    // Should render the fallback
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render nothing when user does not have permission and no fallback', async () => {
    // Mock Auth Context
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      checkPermission: jest.fn().mockResolvedValue(false),
      hasPermission: jest.fn().mockReturnValue(false)
    });
    
    render(
      <PermissionGuard 
        resource="users"
        action="delete"
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for the permission check to resolve
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
    
    // Should not render the children
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should use checkPermission when forceCheck is true', async () => {
    // Mock Auth Context with different results for cached vs server check
    const mockCheckPermission = jest.fn().mockResolvedValue(true);
    const mockHasPermission = jest.fn().mockReturnValue(false);
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      checkPermission: mockCheckPermission,
      hasPermission: mockHasPermission
    });
    
    render(
      <PermissionGuard 
        resource="users"
        action="update"
        forceCheck={true}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for the permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Should have used the server-side check
    expect(mockCheckPermission).toHaveBeenCalledWith('users', 'update');
    expect(mockHasPermission).not.toHaveBeenCalled();
  });

  it('should use hasPermission when forceCheck is false', async () => {
    // Mock Auth Context
    const mockCheckPermission = jest.fn().mockResolvedValue(false);
    const mockHasPermission = jest.fn().mockReturnValue(true);
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      checkPermission: mockCheckPermission,
      hasPermission: mockHasPermission
    });
    
    render(
      <PermissionGuard 
        resource="users"
        action="read"
        forceCheck={false}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for the permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Should have used the client-side check
    expect(mockCheckPermission).not.toHaveBeenCalled();
    expect(mockHasPermission).toHaveBeenCalledWith('users', 'read');
  });

  it('should deny access when user is not authenticated', async () => {
    // Mock Auth Context with no user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      checkPermission: jest.fn().mockResolvedValue(true),
      hasPermission: jest.fn().mockReturnValue(true)
    });
    
    render(
      <PermissionGuard 
        resource="users"
        action="read"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for the permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
    
    // Should render the fallback
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});