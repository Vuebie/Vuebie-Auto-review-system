/**
 * Simple in-memory cache for user permissions
 * to reduce the number of server calls
 */

import { Permission } from './permission';

interface PermissionCacheEntry {
  permissions: Permission[];
  timestamp: number;
}

class PermissionCache {
  private cache: Record<string, PermissionCacheEntry> = {};
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get permissions for a user from cache if available and not expired
   */
  public getUserPermissions(userId: string): Permission[] | null {
    const entry = this.cache[userId];
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > this.TTL_MS) {
      // Cache entry has expired
      delete this.cache[userId];
      return null;
    }
    
    return entry.permissions;
  }
  
  /**
   * Store permissions for a user in cache
   */
  public setUserPermissions(userId: string, permissions: Permission[]): void {
    this.cache[userId] = {
      permissions,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Invalidate the cache for a user
   */
  public invalidateUserPermissions(userId: string): void {
    delete this.cache[userId];
  }
  
  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache = {};
  }
}

// Export singleton instance
const permissionCache = new PermissionCache();
export default permissionCache;