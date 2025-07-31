import PermissionCache from '../../lib/permission-cache';

describe('PermissionCache', () => {
  beforeEach(() => {
    // Clear the cache before each test
    PermissionCache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize with default settings', () => {
    expect(PermissionCache).toBeDefined();
  });

  it('should set and get user permissions correctly', () => {
    const userId = 'user123';
    const permissions = [
      { resource: 'users', action: 'manage' },
      { resource: 'reports', action: 'view' }
    ];
    
    PermissionCache.setUserPermissions(userId, permissions);
    
    expect(PermissionCache.getUserPermissions(userId)).toEqual(permissions);
  });

  it('should return null for non-existent user permissions', () => {
    const nonExistentUserId = 'user999';
    
    expect(PermissionCache.getUserPermissions(nonExistentUserId)).toBeNull();
  });

  it('should check if user has cached permissions', () => {
    const userId = 'user123';
    const permissions = [{ resource: 'users', action: 'manage' }];
    
    PermissionCache.setUserPermissions(userId, permissions);
    
    expect(PermissionCache.getUserPermissions(userId)).not.toBeNull();
  });

  it('should invalidate user permissions', () => {
    const userId = 'user123';
    const permissions = [
      { resource: 'users', action: 'manage' },
      { resource: 'reports', action: 'view' }
    ];
    
    PermissionCache.setUserPermissions(userId, permissions);
    expect(PermissionCache.getUserPermissions(userId)).toEqual(permissions);
    
    PermissionCache.invalidateUserPermissions(userId);
    
    expect(PermissionCache.getUserPermissions(userId)).toBeNull();
  });

  it('should expire entries after TTL', () => {
    const userId = 'user123';
    const permissions = [{ resource: 'users', action: 'manage' }];
    
    PermissionCache.setUserPermissions(userId, permissions);
    
    // Value should be available initially
    expect(PermissionCache.getUserPermissions(userId)).toEqual(permissions);
    
    // Advance time past TTL (5 minutes + buffer)
    jest.advanceTimersByTime(6 * 60 * 1000);
    
    // Value should now be expired
    expect(PermissionCache.getUserPermissions(userId)).toBeNull();
  });

  it('should clear all entries', () => {
    const user1Permissions = [{ resource: 'users', action: 'manage' }];
    const user2Permissions = [{ resource: 'reports', action: 'view' }];
    
    PermissionCache.setUserPermissions('user1', user1Permissions);
    PermissionCache.setUserPermissions('user2', user2Permissions);
    
    PermissionCache.clear();
    
    expect(PermissionCache.getUserPermissions('user1')).toBeNull();
     expect(PermissionCache.getUserPermissions('user2')).toBeNull();
  });
});