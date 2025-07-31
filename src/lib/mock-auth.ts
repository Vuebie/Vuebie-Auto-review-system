// Mock authentication service for development/testing
// This bypasses Supabase when real credentials are not available

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    role: string;
    full_name?: string;
  };
}

export interface MockSession {
  access_token: string;
  user: MockUser;
}

// Mock users for testing
const MOCK_USERS: Record<string, { password: string; user: MockUser }> = {
  'superadmin@vuebie.com': {
    password: '123456',
    user: {
      id: 'mock-super-admin-id',
      email: 'superadmin@vuebie.com',
      user_metadata: {
        role: 'super_admin',
        full_name: 'Super Admin User'
      }
    }
  },
  'admin@vuebie.com': {
    password: '123456',
    user: {
      id: 'mock-admin-id',
      email: 'admin@vuebie.com',
      user_metadata: {
        role: 'admin',
        full_name: 'Admin User'
      }
    }
  },
  'merchant@vuebie.com': {
    password: '123456',
    user: {
      id: 'mock-merchant-id',
      email: 'merchant@vuebie.com',
      user_metadata: {
        role: 'merchant',
        full_name: 'Merchant User'
      }
    }
  }
};

class MockAuthService {
  private currentSession: MockSession | null = null;
  private authStateListeners: Array<(session: MockSession | null) => void> = [];

  async signInWithPassword(email: string, password: string) {
    console.log('🔐 [DEBUG] MockAuthService.signInWithPassword called with:', { email, password: '***' });
    console.log('🔧 [MOCK AUTH] Attempting login with:', email);
    
    const mockUser = MOCK_USERS[email];
    console.log('🔍 [DEBUG] User lookup result:', mockUser ? `Found user: ${mockUser.user.email} (${mockUser.user.user_metadata.role})` : 'No user found');
    
    if (!mockUser || mockUser.password !== password) {
      console.log('❌ [DEBUG] Authentication failed - invalid credentials');
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };
    }

    const session: MockSession = {
      access_token: `mock-token-${Date.now()}`,
      user: mockUser.user
    };

    this.currentSession = session;
    this.notifyAuthStateChange(session);

    console.log('✅ [DEBUG] Authentication successful, returning session for:', mockUser.user.email);
    console.log('✅ [MOCK AUTH] Login successful for:', email);
    return {
      data: { user: mockUser.user, session },
      error: null
    };
  }

  async signOut() {
    console.log('🔧 [MOCK AUTH] Signing out');
    this.currentSession = null;
    this.notifyAuthStateChange(null);
    return { error: null };
  }

  async getSession() {
    return {
      data: { session: this.currentSession },
      error: null
    };
  }

  async getUser() {
    return {
      data: { user: this.currentSession?.user || null },
      error: null
    };
  }

  onAuthStateChange(callback: (session: MockSession | null) => void) {
    this.authStateListeners.push(callback);
    // Immediately call with current state
    callback(this.currentSession);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
              this.authStateListeners.splice(index, 1);
            }
          }
        }
      }
    };
  }

  private notifyAuthStateChange(session: MockSession | null) {
    this.authStateListeners.forEach(listener => listener(session));
  }

  // Mock database operations
  from(table: string) {
    return {
      select: () => ({
        data: [],
        error: null
      }),
      insert: () => ({
        data: null,
        error: null
      }),
      update: () => ({
        data: null,
        error: null
      }),
      delete: () => ({
        data: null,
        error: null
      })
    };
  }
}

export const mockAuthService = new MockAuthService();

// Check if we should use mock auth (when Supabase is not properly configured)
export function shouldUseMockAuth(): boolean {
  // Force mock auth for demo/testing purposes
  // Set to false to use real Supabase authentication
  console.log('🔍 [DEBUG] shouldUseMockAuth called - returning true (forced)');
  return true;
  
  // Original logic (commented out for demo mode):
  // const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // const hasPlaceholderUrl = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('example');
  // const hasPlaceholderKey = !supabaseKey || supabaseKey.includes('placeholder') || supabaseKey.includes('example');
  // return hasPlaceholderUrl || hasPlaceholderKey;
}