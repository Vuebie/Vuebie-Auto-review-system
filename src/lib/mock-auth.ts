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
    console.log('🔍 [DEBUG] Available mock users:', Object.keys(MOCK_USERS));
    console.log('🔍 [DEBUG] Input email type:', typeof email, 'Input password type:', typeof password);
    console.log('🔍 [DEBUG] Input email length:', email.length, 'Input password length:', password.length);
    
    const mockUser = MOCK_USERS[email];
    console.log('🔍 [DEBUG] User lookup result:', mockUser ? `Found user: ${mockUser.user.email} (${mockUser.user.user_metadata.role})` : 'No user found');
    
    if (mockUser) {
      console.log('🔍 [DEBUG] Expected password:', mockUser.password, 'Received password:', password);
      console.log('🔍 [DEBUG] Password match:', mockUser.password === password);
      console.log('🔍 [DEBUG] Password comparison details:', {
        expected: mockUser.password,
        received: password,
        expectedLength: mockUser.password.length,
        receivedLength: password.length,
        match: mockUser.password === password
      });
    }
    
    if (!mockUser || mockUser.password !== password) {
      console.log('❌ [DEBUG] Authentication failed - invalid credentials');
      console.log('❌ [DEBUG] Failure reason:', !mockUser ? 'User not found' : 'Password mismatch');
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

  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    const wrappedCallback = (session: MockSession | null) => {
      const event = session ? 'SIGNED_IN' : 'SIGNED_OUT';
      console.log(`🔔 [MOCK AUTH] Auth state change event: ${event}`, session ? 'with session' : 'no session');
      callback(event, session);
    };
    
    this.authStateListeners.push(wrappedCallback);
    // Immediately call with current state
    wrappedCallback(this.currentSession);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authStateListeners.indexOf(wrappedCallback);
            if (index > -1) {
              this.authStateListeners.splice(index, 1);
            }
          }
        }
      }
    };
  }

  private notifyAuthStateChange(session: MockSession | null) {
    const event = session ? 'SIGNED_IN' : 'SIGNED_OUT';
    console.log(`🔔 [MOCK AUTH] Notifying ${this.authStateListeners.length} listeners of auth state change: ${event}`);
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
  console.log('🔍 [MOCK AUTH] shouldUseMockAuth called - returning true (forced for testing)');
  return true;
  
  // Original logic (commented out for testing):
  // const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // 
  // const useMock = !supabaseUrl || !supabaseKey || 
  //   supabaseUrl === 'your-supabase-url' || 
  //   supabaseKey === 'your-supabase-anon-key' ||
  //   import.meta.env.VITE_USE_MOCK_AUTH === 'true';
  // 
  // console.log('🔍 [MOCK AUTH] Environment check:', {
  //   supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
  //   supabaseKey: supabaseKey ? 'Set' : 'Missing',
  //   forceMock: import.meta.env.VITE_USE_MOCK_AUTH,
  //   useMock
  // });
  // 
  // console.log('🔍 [MOCK AUTH] shouldUseMockAuth returning:', useMock);
  // 
  // return useMock;
}