import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as auth from '../../lib/auth';
import * as permission from '../../lib/permission';
import permissionCache from '../../lib/permission-cache';

// Mock auth and permission modules
jest.mock('../../lib/auth', () => ({
  getCurrentUser: jest.fn(),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(),
  signInWithProvider: jest.fn(),
}));

jest.mock('../../lib/permission', () => ({
  checkPermission: jest.fn(),
  getUserPermissions: jest.fn(),
}));

jest.mock('../../lib/permission-cache', () => ({
  invalidateUserPermissions: jest.fn(),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, error } = useAuth();
  
  if (loading) return <div data-testid="loading">Loading...</div>;
  
  return (
    <div>
      <div data-testid="user-state">{user ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-id">{user.user.id}</div>}
      {error && <div data-testid="error">{error}</div>}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });
  
  it('should initialize with loading state', () => {
    // Mock getCurrentUser to be pending (never resolves)
    (auth.getCurrentUser as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
  
  it('should set user when authenticated', async () => {
    // Mock successful authentication
    const mockUser = {
      user: { 
        id: 'test-user-id', 
        email: 'test@example.com' 
      },
      role: 'admin',
      permissions: [
        { resource: 'users', actions: ['read', 'create'] }
      ]
    };
    
    (auth.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially should be loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('user-state').textContent).toBe('Authenticated');
    expect(screen.getByTestId('user-id').textContent).toBe('test-user-id');
  });
  
  it('should handle unauthenticated state', async () => {
    // Mock no user (not authenticated)
    (auth.getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('user-state').textContent).toBe('Not Authenticated');
    expect(screen.queryByTestId('user-id')).not.toBeInTheDocument();
  });
  
  it('should handle login function', async () => {
    // Setup: First ensure we're not authenticated
    (auth.getCurrentUser as jest.Mock).mockResolvedValue(null);
    
    // Render the component
    const LoginTestComponent = () => {
      const { login, user, loading } = useAuth();
      
      const handleLogin = async () => {
        if (!user && !loading) {
          try {
            await login('user@example.com', 'password');
          } catch (error) {
            // Ignore errors for testing
          }
        }
      };
      
      return (
        <div>
          {loading && <div data-testid="loading">Loading...</div>}
          <div data-testid="user-state">{user ? 'Authenticated' : 'Not Authenticated'}</div>
          {user && <div data-testid="user-id">{user.user.id}</div>}
          <button data-testid="login-button" onClick={handleLogin}>Login</button>
        </div>
      );
    };
    
    render(
      <AuthProvider>
        <LoginTestComponent />
      </AuthProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Verify initial state
    expect(screen.getByTestId('user-state').textContent).toBe('Not Authenticated');
    
    // Setup mock for login action
    const mockUser = {
      user: { id: 'logged-in-user', email: 'user@example.com' },
      role: 'user',
      permissions: [{ resource: 'posts', actions: ['read'] }]
    };
    (auth.signInWithEmail as jest.Mock).mockResolvedValueOnce(mockUser);
    
    // Trigger login
    await act(async () => {
      screen.getByTestId('login-button').click();
    });
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-state').textContent).toBe('Authenticated');
    });
    
    expect(auth.signInWithEmail).toHaveBeenCalledWith('user@example.com', 'password');
    expect(screen.getByTestId('user-id').textContent).toBe('logged-in-user');
  });
  
  it('should handle login errors', async () => {
    // Setup: First ensure we're not authenticated
    (auth.getCurrentUser as jest.Mock).mockResolvedValue(null);
    
    // Render the component with error handling
    const LoginErrorComponent = () => {
      const { login, user, loading, error } = useAuth();
      const [loginAttempted, setLoginAttempted] = React.useState(false);
      
      const handleLogin = async () => {
        if (!user && !loading && !loginAttempted) {
          setLoginAttempted(true);
          try {
            await login('user@example.com', 'wrong-password');
          } catch (error) {
            // Error will be handled by AuthContext
          }
        }
      };
      
      React.useEffect(() => {
        if (!loading && !user && !loginAttempted) {
          handleLogin();
        }
      }, [loading, user, loginAttempted]);
      
      return (
        <div>
          {loading && <div data-testid="loading">Loading...</div>}
          <div data-testid="user-state">{user ? 'Authenticated' : 'Not Authenticated'}</div>
          {error && <div data-testid="error">{error}</div>}
        </div>
      );
    };
    
    // Setup mock for login error
    (auth.signInWithEmail as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(
      <AuthProvider>
        <LoginErrorComponent />
      </AuthProvider>
    );
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('user-state').textContent).toBe('Not Authenticated');
    expect(screen.getByTestId('error').textContent).toContain('Invalid credentials');
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle logout', async () => {
    // Mock successful logout
    const mockUser = {
      user: { id: 'test-user', email: 'test@example.com' },
      role: 'admin',
      permissions: []
    };
    
    (auth.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
    (auth.signOut as jest.Mock).mockResolvedValueOnce(undefined);
    
    // Create test component that calls logout
    const LogoutTestComponent = () => {
      const { logout, user, loading } = useAuth();
      const [loggedOut, setLoggedOut] = React.useState(false);
      
      const handleLogout = async () => {
        await logout();
        setLoggedOut(true);
      };
      
      if (loading) return <div data-testid="loading">Loading...</div>;
      
      return (
        <div>
          <div data-testid="user-state">{user ? 'Authenticated' : 'Not Authenticated'}</div>
          {user && !loggedOut && (
            <button data-testid="logout-button" onClick={handleLogout}>
              Logout
            </button>
          )}
          {loggedOut && <div data-testid="logged-out">Logged Out</div>}
        </div>
      );
    };
    
    render(
      <AuthProvider>
        <LogoutTestComponent />
      </AuthProvider>
    );
    
    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByTestId('user-state').textContent).toBe('Authenticated');
    });
    
    // Click logout button
    await act(async () => {
      screen.getByTestId('logout-button').click();
    });
    
    // Should now be logged out
    await waitFor(() => {
      expect(screen.getByTestId('user-state').textContent).toBe('Not Authenticated');
    });
    
    expect(auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('logged-out')).toBeInTheDocument();
  });
  
  it('should check permissions correctly', async () => {
    // Mock user with permissions
    const mockUser = {
      user: { id: 'test-user', email: 'test@example.com' },
      role: 'editor',
      permissions: [
        { resource: 'articles', actions: ['read', 'create', 'update'] },
        { resource: 'comments', actions: ['read', 'create'] }
      ]
    };
    
    (auth.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
    (permission.checkPermission as jest.Mock).mockResolvedValue(true);
    
    // Create test component that checks permissions
    const PermissionTestComponent = () => {
      const { hasPermission, checkPermission, user, loading } = useAuth();
      const [clientResult, setClientResult] = React.useState<boolean | null>(null);
      const [serverResult, setServerResult] = React.useState<boolean | null>(null);
      
      React.useEffect(() => {
        if (user) {
          // Client-side check
          const result = hasPermission('articles', 'update');
          setClientResult(result);
          
          // Server-side check
          checkPermission('articles', 'delete').then(result => {
            setServerResult(result);
          });
        }
      }, [user, hasPermission, checkPermission]);
      
      if (loading) return <div data-testid="loading">Loading...</div>;
      
      return (
        <div>
          {clientResult !== null && (
            <div data-testid="client-permission">
              {clientResult ? 'Has Permission' : 'No Permission'}
            </div>
          )}
          {serverResult !== null && (
            <div data-testid="server-permission">
              {serverResult ? 'Has Permission' : 'No Permission'}
            </div>
          )}
        </div>
      );
    };
    
    render(
      <AuthProvider>
        <PermissionTestComponent />
      </AuthProvider>
    );
    
    // Wait for permission checks to complete
    await waitFor(() => {
      expect(screen.getByTestId('client-permission')).toBeInTheDocument();
      expect(screen.getByTestId('server-permission')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('client-permission').textContent).toBe('Has Permission');
    expect(screen.getByTestId('server-permission').textContent).toBe('Has Permission');
    expect(permission.checkPermission).toHaveBeenCalledWith('test-user', 'articles', 'delete');
  });
  
  it('should invalidate permission cache', async () => {
    // Mock user
    const mockUser = {
      user: { id: 'test-user', email: 'test@example.com' },
      role: 'user',
      permissions: []
    };
    
    (auth.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
    
    // Create test component that invalidates cache
    const CacheTestComponent = () => {
      const { invalidatePermissionCache, user, loading } = useAuth();
      
      React.useEffect(() => {
        if (user) {
          invalidatePermissionCache();
        }
      }, [user, invalidatePermissionCache]);
      
      if (loading) return <div data-testid="loading">Loading...</div>;
      
      return (
        <div data-testid="cache-test">Cache Test</div>
      );
    };
    
    render(
      <AuthProvider>
        <CacheTestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('cache-test')).toBeInTheDocument();
    });
    
    expect(permissionCache.invalidateUserPermissions).toHaveBeenCalledWith('test-user');
  });
});