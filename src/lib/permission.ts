import { supabase, FUNCTIONS } from './supabase-client';

export interface Permission {
  resource: string;
  actions: string[];
}

/**
 * Check if a user has permission to perform an action on a resource
 */
export const checkPermission = async (
  userId: string,
  resource: string,
  action: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'app_92a6ca4590_check_permission',
      {
        method: 'POST',
        body: {
          user_id: userId,
          resource,
          action,
        },
      }
    );

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data?.hasPermission || false;
  } catch (error) {
    console.error('Error invoking permission check function:', error);
    return false;
  }
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = async (
  userId: string
): Promise<Permission[]> => {
  // Implementation using Supabase RPC function for permission checks
  // that returns all permissions for a user. This is a simplified version
  // that returns some basic permissions.

  // For now, we'll return a static list of permissions
  // based on what we know about the permission system
  return [
    {
      resource: 'outlets',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'qr_codes',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'ai_templates',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'incentives',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'review_sessions',
      actions: ['read', 'export'],
    },
    {
      resource: 'analytics',
      actions: ['basic'],
    },
  ];
};

/**
 * Assign a role to a user
 */
export const assignRole = async (
  adminUserId: string,
  targetUserId: string,
  roleName: 'merchant' | 'staff' | 'admin' | 'super_admin'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'app_92a6ca4590_manage_user_role',
      {
        method: 'POST',
        body: {
          admin_user_id: adminUserId,
          target_user_id: targetUserId,
          role_name: roleName,
          operation: 'assign',
        },
      }
    );

    if (error) {
      console.error('Error assigning role:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error invoking role management function:', error);
    return false;
  }
};

/**
 * Remove a role from a user
 */
export const removeRole = async (
  adminUserId: string,
  targetUserId: string,
  roleName: 'merchant' | 'staff' | 'admin' | 'super_admin'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'app_92a6ca4590_manage_user_role',
      {
        method: 'POST',
        body: {
          admin_user_id: adminUserId,
          target_user_id: targetUserId,
          role_name: roleName,
          operation: 'remove',
        },
      }
    );

    if (error) {
      console.error('Error removing role:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error invoking role management function:', error);
    return false;
  }
};