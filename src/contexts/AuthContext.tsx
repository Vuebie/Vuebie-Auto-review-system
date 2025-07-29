import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, TABLES, FUNCTIONS, MerchantProfile } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: MerchantProfile | null;
  roles: string[];
  checkPermission: (resource: string, action: string) => Promise<boolean>;
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
  const [hasMerchantRole, setHasMerchantRole] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasSuperAdminRole, setHasSuperAdminRole] = useState(false);

  // Load user and their profile
  const loadUser = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setUser(user);

      if (user) {
        // Load merchant profile
        const { data: profile } = await supabase
          .from(TABLES.MERCHANT_PROFILES)
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setProfile(profile);

        // Load user roles
        const { data: userRoles } = await supabase
          .from(TABLES.USER_ROLES)
          .select('role:role_id(name)')
          .eq('user_id', user.id);
        
        if (userRoles) {
          const roleNames = userRoles.map((r: { role: { name: string } }) => r.role.name);
          setRoles(roleNames);
          setHasMerchantRole(roleNames.includes('merchant'));
          setHasAdminRole(roleNames.includes('admin'));
          setHasSuperAdminRole(roleNames.includes('super_admin'));
        }
      } else {
        setProfile(null);
        setRoles([]);
        setHasMerchantRole(false);
        setHasAdminRole(false);
        setHasSuperAdminRole(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await loadUser();
  };

  // Check if user has a specific permission
  const checkPermission = async (resource: string, action: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(FUNCTIONS.CHECK_PERMISSION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify({ resource, action })
      });
      
      const result = await response.json();
      return result.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
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
    refreshUser,
    checkPermission,
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