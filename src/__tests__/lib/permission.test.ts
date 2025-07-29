import { checkPermission, getUserPermissions, getUserRoles, assignRoleToUser, removeRoleFromUser, invalidateUserPermissionCache } from '../../lib/permission';
import { supabase } from '../../lib/supabase';
import permissionCache from '../../lib/permission-cache';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        match: jest.fn()
      })),
      delete: jest.fn(() => ({
        match: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn()
      }))
    }))
  }
}));

jest.mock('../../lib/permission-cache', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    invalidateUserPermissions: jest.fn()
  }
}));

describe('Permission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  describe('checkPermission', () => {
    it('should return true when permission exists', async () => {
      // Mock cache miss
      jest.mocked(permissionCache.get).mockReturnValueOnce(undefined);
      
      // Mock RPC response
      jest.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [
          { resource: 'users', actions: ['read', 'write'] }
        ],
        error: null
      });

      const result = await checkPermission('user-123', 'users', 'read');
      
      expect(result).toBe(true);
      expect(permissionCache.set).toHaveBeenCalledWith(
        'permission:user-123:users:read',
        true
      );
      expect(supabase.rpc).toHaveBeenCalledWith(
        'app_0be8fb8541_get_user_effective_permissions',
        { p_user_id: 'user-123' }
      );
    });

    it('should return false when permission does not exist', async () => {
      // Mock cache miss
      jest.mocked(permissionCache.get).mockReturnValueOnce(undefined);
      
      // Mock RPC response
      jest.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [
          { resource: 'users', actions: ['write'] }
        ],
        error: null
      });

      const result = await checkPermission('user-123', 'users', 'read');
      
      expect(result).toBe(false);
      expect(permissionCache.set).toHaveBeenCalledWith(
        'permission:user-123:users:read',
        false
      );
    });

    it('should return false when the resource does not exist', async () => {
      // Mock cache miss
      jest.mocked(permissionCache.get).mockReturnValueOnce(undefined);
      
      // Mock RPC response
      jest.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [
          { resource: 'users', actions: ['read', 'write'] }
        ],
        error: null
      });

      const result = await checkPermission('user-123', 'posts', 'read');
      
      expect(result).toBe(false);
    });

    it('should return cached result when available', async () => {
      // Mock cache hit
      jest.mocked(permissionCache.get).mockReturnValueOnce(true);

      const result = await checkPermission('user-123', 'users', 'read');
      
      expect(result).toBe(true);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should return false when there is an error', async () => {
      // Mock cache miss
      jest.mocked(permissionCache.get).mockReturnValueOnce(undefined);
      
      // Mock RPC error response
      jest.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await checkPermission('user-123', 'users', 'read');
      
      expect(result).toBe(false);
      expect(permissionCache.set).toHaveBeenCalledWith(
        'permission:user-123:users:read',
        false
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions from cache when available', async () => {
      const permissions = [
        { resource: 'users', actions: ['read', 'write'] }
      ];
      
      jest.mocked(permissionCache.get).mockReturnValueOnce(permissions);

      const result = await getUserPermissions('user-123');
      
      expect(result).toEqual(permissions);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should fetch and transform permissions when not in cache', async () => {
      // Mock cache miss
      jest.mocked(permissionCache.get).mockReturnValueOnce(undefined);
      
      // Mock RPC response
      jest.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [
          { resource: 'users', actions: ['read', 'write'] },
          { resource: 'posts', actions: ['read'] }
        ],
        error: null
      });

      const result = await getUserPermissions('user-123');
      
      expect(result).toEqual([
        { resource: 'users', actions: ['read', 'write'] },
        { resource: 'posts', actions: ['read'] }
      ]);
      expect(permissionCache.set).toHaveBeenCalledWith(
        'permissions:user-123',
        expect.any(Array)
      );
    });

    it('should return empty array on error', async () => {
      // Mock cache miss
      jest.mocked(permissionCache.get).mockReturnValueOnce(undefined);
      
      // Mock RPC error response
      jest.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getUserPermissions('user-123');
      
      expect(result).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    it('should fetch user roles correctly', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis()
      });
      
      const mockFrom = jest.fn(() => ({
        select: mockSelect
      }));

      jest.mocked(supabase.from).mockImplementation(mockFrom);
      
      // Mock response for the user roles query
      mockSelect().eq.mockResolvedValueOnce({
        data: [
          { 
            role_id: '1', 
            app_0be8fb8541_roles: { name: 'admin' } 
          },
          { 
            role_id: '2', 
            app_0be8fb8541_roles: { name: 'editor' } 
          }
        ],
        error: null
      });

      const result = await getUserRoles('user-123');
      
      expect(result).toEqual(['admin', 'editor']);
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_user_roles');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('role_id'));
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis()
      });
      
      const mockFrom = jest.fn(() => ({
        select: mockSelect
      }));

      jest.mocked(supabase.from).mockImplementation(mockFrom);
      
      // Mock error response
      mockSelect().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getUserRoles('user-123');
      
      expect(result).toEqual([]);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role successfully', async () => {
      // Mock getting role ID
      const mockSingleSelect = jest.fn().mockResolvedValueOnce({
        data: { id: 'role-1' },
        error: null
      });

      const mockEq = jest.fn().mockReturnValue({
        single: mockSingleSelect
      });

      const mockRoleSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });

      // Mock role assignment
      const mockInsertSelect = jest.fn().mockResolvedValueOnce({
        data: [{ id: 'user-role-1' }],
        error: null
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockInsertSelect
      });

      // Mock audit log
      const mockAuditInsert = jest.fn().mockResolvedValueOnce({
        data: null,
        error: null
      });

      const mockFrom = jest.fn((table) => {
        if (table === 'app_0be8fb8541_roles') {
          return { select: mockRoleSelect };
        } else if (table === 'app_0be8fb8541_user_roles') {
          return { insert: mockInsert };
        } else if (table === 'app_0be8fb8541_audit_logs') {
          return { insert: mockAuditInsert };
        }
      });

      jest.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await assignRoleToUser('user-123', 'admin');
      
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_roles');
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_user_roles');
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_audit_logs');
      expect(mockEq).toHaveBeenCalledWith('name', 'admin');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        role_id: 'role-1'
      });
      expect(permissionCache.invalidateUserPermissions).toHaveBeenCalledWith('user-123');
    });

    it('should return false if role not found', async () => {
      // Mock getting role ID with error
      const mockSingleSelect = jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Role not found' }
      });

      const mockEq = jest.fn().mockReturnValue({
        single: mockSingleSelect
      });

      const mockRoleSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });

      const mockFrom = jest.fn(() => ({
        select: mockRoleSelect
      }));

      jest.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await assignRoleToUser('user-123', 'non-existent-role');
      
      expect(result).toBe(false);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role successfully', async () => {
      // Mock getting role ID
      const mockSingleSelect = jest.fn().mockResolvedValueOnce({
        data: { id: 'role-1' },
        error: null
      });

      const mockEq = jest.fn().mockReturnValue({
        single: mockSingleSelect
      });

      const mockRoleSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });

      // Mock role removal
      const mockDeleteMatch = jest.fn().mockResolvedValueOnce({
        data: null,
        error: null
      });

      const mockDelete = jest.fn().mockReturnValue({
        match: mockDeleteMatch
      });

      // Mock audit log
      const mockAuditInsert = jest.fn().mockResolvedValueOnce({
        data: null,
        error: null
      });

      const mockFrom = jest.fn((table) => {
        if (table === 'app_0be8fb8541_roles') {
          return { select: mockRoleSelect };
        } else if (table === 'app_0be8fb8541_user_roles') {
          return { delete: mockDelete };
        } else if (table === 'app_0be8fb8541_audit_logs') {
          return { insert: mockAuditInsert };
        }
      });

      jest.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await removeRoleFromUser('user-123', 'admin');
      
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_roles');
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_user_roles');
      expect(mockFrom).toHaveBeenCalledWith('app_0be8fb8541_audit_logs');
      expect(mockEq).toHaveBeenCalledWith('name', 'admin');
      expect(mockDeleteMatch).toHaveBeenCalledWith({
        user_id: 'user-123',
        role_id: 'role-1'
      });
      expect(permissionCache.invalidateUserPermissions).toHaveBeenCalledWith('user-123');
    });
  });

  describe('invalidateUserPermissionCache', () => {
    it('should call permissionCache.invalidateUserPermissions', () => {
      invalidateUserPermissionCache('user-123');
      expect(permissionCache.invalidateUserPermissions).toHaveBeenCalledWith('user-123');
    });
  });
});