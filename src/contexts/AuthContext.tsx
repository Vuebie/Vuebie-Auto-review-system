import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, TABLES, FUNCTIONS, isSupabaseConfigured } from '@/lib/supabase-with-fallback';
import { MerchantProfile } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: MerchantProfile | null;
  roles: string[];
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (resource: string, action: string) => Promise<boolean>;
  hasPermission: (resource: string, action: string) => boolean;
  refreshUser: () => Promise<void>;
  hasMerchantRole: boolean;
  hasAdminRole: boolean;
  hasSuperAdminRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMerchantRole, setHasMerchantRole] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasSuperAdminRole, setHasSuperAdminRole] = useState(false);

  // Load user and their profile
  const loadUser = async () => {
    setLoading(true);
    try {
      const { user: userProfile, error } = await getCurrentUser();
      
      if (error) {
        setUser(null);
        return;
      }
      
      // Convert UserProfile to User type for compatibility
      const user = userProfile ? {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        user_metadata: {
          role: userProfile.role
        }
      } as User : null;
      
      setUser(user);

      if (user) {
        try {
          // Load merchant profile
          const { data: profile, error: profileError } = await supabase
            .from(TABLES.MERCHANT_PROFILES)
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          setProfile(profile);

          // Load user roles
          const { data: userRoles, error: rolesError } = await supabase
            .from(TABLES.USER_ROLES)
            .select('role:role_id(name)')
            .eq('user_id', user.id);
          
          if (rolesError) {
            // Set default role based on user profile
            const defaultRoles = [userProfile.role || 'customer'];
            setRoles(defaultRoles);
            setHasMerchantRole(defaultRoles.includes('merchant'));
            setHasAdminRole(defaultRoles.includes('admin'));
            setHasSuperAdminRole(defaultRoles.includes('super_admin'));
          } else if (userRoles) {
            const roleNames = userRoles.map((r: { role: { name: string } }) => r.role.name);
            setRoles(roleNames);
            setHasMerchantRole(roleNames.includes('merchant'));
            setHasAdminRole(roleNames.includes('admin'));
            setHasSuperAdminRole(roleNames.includes('super_admin'));
          }
        } catch (roleError) {
          // Fallback to profile role
          const fallbackRole = userProfile.role || 'customer';
          setRoles([fallbackRole]);
          setHasMerchantRole(fallbackRole === 'merchant');
          setHasAdminRole(['admin', 'super_admin'].includes(fallbackRole));
          setHasSuperAdminRole(fallbackRole === 'super_admin');
        }
      } else {
        setProfile(null);
        setRoles([]);
        setHasMerchantRole(false);
        setHasAdminRole(false);
        setHasSuperAdminRole(false);
      }
    } catch (error) {
      // Clear all user state on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user';
      setError(errorMessage);
      console.error('Load user error:', error);
      setUser(null);
      setProfile(null);
      setRoles([]);
      setHasMerchantRole(false);
      setHasAdminRole(false);
      setHasSuperAdminRole(false);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await loadUser();
  };

  // Login method
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      await loadUser();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      // Clear all state
      setUser(null);
      setProfile(null);
      setRoles([]);
      setHasMerchantRole(false);
      setHasAdminRole(false);
      setHasSuperAdminRole(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission (synchronous version)
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Simple role-based permission check
    const userRole = user.user_metadata?.role || roles[0] || 'customer';
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin' && ['users', 'settings', 'reports'].includes(resource)) return true;
    if (userRole === 'merchant' && ['campaigns', 'reviews', 'outlets'].includes(resource)) return true;
    return false;
  };

  // Check if user has a specific permission (async version)
  const checkPermission = async (resource: string, action: string): Promise<boolean> => {
    if (!user) return false;
    
    // In mock mode, grant permissions based on user role
    if (!isSupabaseConfigured()) {
      return hasPermission(resource, action);
    }
    
    try {
      const response = await fetch(FUNCTIONS.CHECK_PERMISSION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ resource, action })
      });
      
      const result = await response.json();
      return result.hasPermission;
    } catch (error) {
      return false;
    }
  };

  // Set up auth state listener
  useEffect(() => {
    loadUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRoles([]);
        } else if (event === 'USER_UPDATED') {
          await loadUser();
        }
      }
    );

    return () => {
      if (authListener && authListener.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    profile,
    roles,
    loading,
    error,
    login,
    logout,
    refreshUser,
    checkPermission,
    hasPermission,
    hasMerchantRole,
    hasAdminRole,
    hasSuperAdminRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}