import PermissionCache, { PermissionCache as PermissionCacheClass } from '../../lib/permission-cache';

describe('PermissionCache', () => {
  beforeEach(() => {
    // Clear the cache before each test
    jest.spyOn(PermissionCacheClass.prototype, 'clear').mockImplementation(function() {
      (this as { cache: Map<string, unknown> }).cache.clear();
    });
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

  it('should set and get a value correctly', () => {
    const userId = 'user123';
    const permission = 'MANAGE_USERS';
    const key = `permission:${userId}:${permission}`;
    
    PermissionCache.set(key, true);
    
    expect(PermissionCache.get(key)).toBe(true);
  });

  it('should return undefined for non-existent keys', () => {
    const nonExistentKey = 'permission:user123:NON_EXISTENT_PERMISSION';
    
    expect(PermissionCache.get(nonExistentKey)).toBeUndefined();
  });

  it('should check if key exists with has method', () => {
    const key = 'permission:user123:MANAGE_USERS';
    
    PermissionCache.set(key, true);
    
    expect(PermissionCache.has(key)).toBe(true);
    expect(PermissionCache.has('nonexistent-key')).toBe(false);
  });

  it('should delete specific keys', () => {
    const key = 'permission:user123:MANAGE_USERS';
    
    PermissionCache.set(key, true);
    expect(PermissionCache.has(key)).toBe(true);
    
    PermissionCache.delete(key);
    expect(PermissionCache.has(key)).toBe(false);
  });

  it('should invalidate user permissions', () => {
    const userId = 'user123';
    
    PermissionCache.set(`permission:${userId}:MANAGE_USERS`, true);
    PermissionCache.set(`permission:${userId}:VIEW_REPORTS`, true);
    PermissionCache.set('permission:other-user:MANAGE_USERS', true);
    
    PermissionCache.invalidateUserPermissions(userId);
    
    expect(PermissionCache.get(`permission:${userId}:MANAGE_USERS`)).toBeUndefined();
    expect(PermissionCache.get(`permission:${userId}:VIEW_REPORTS`)).toBeUndefined();
    expect(PermissionCache.get('permission:other-user:MANAGE_USERS')).toBe(true);
  });

  it('should expire entries after TTL', () => {
    const key = 'permission:user123:MANAGE_USERS';
    
    PermissionCache.set(key, true, 1000); // 1 second TTL
    
    // Value should be available initially
    expect(PermissionCache.get(key)).toBe(true);
    
    // Advance time past TTL
    jest.advanceTimersByTime(1500);
    
    // Value should now be expired
    expect(PermissionCache.get(key)).toBeUndefined();
  });

  it('should clear all entries', () => {
    PermissionCache.set('permission:user1:MANAGE_USERS', true);
    PermissionCache.set('permission:user2:VIEW_REPORTS', true);
    
    PermissionCache.clear();
    
    expect(PermissionCache.get('permission:user1:MANAGE_USERS')).toBeUndefined();
    expect(PermissionCache.get('permission:user2:VIEW_REPORTS')).toBeUndefined();
  });
});