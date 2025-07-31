// Supabase client with mock fallback for development
import { createClient } from '@supabase/supabase-js';
import { mockAuthService, shouldUseMockAuth } from './mock-auth';

// Check if we should use mock auth
const useMockAuth = shouldUseMockAuth();
console.log('🚀 [DEBUG] Supabase client initialization - using mock:', useMockAuth);

if (useMockAuth) {
  console.log('🔧 [SUPABASE FALLBACK] Using mock authentication service (Supabase not properly configured)');
} else {
  console.log('✅ [SUPABASE FALLBACK] Using real Supabase client');
}

// Create real Supabase client or mock
let supabaseClient: any;

if (useMockAuth) {
  // Create mock client that mimics Supabase API
  console.log('🔧 [SUPABASE FALLBACK] Creating mock client with mockAuthService');
  supabaseClient = {
    auth: {
      signInWithPassword: async (credentials: any) => {
        console.log('🔐 [SUPABASE FALLBACK] Mock auth.signInWithPassword called with:', credentials.email);
        return await mockAuthService.signInWithPassword(credentials.email, credentials.password);
      },
      signOut: async () => {
        console.log('🔐 [SUPABASE FALLBACK] Mock auth.signOut called');
        return await mockAuthService.signOut();
      },
      getSession: async () => {
        console.log('🔐 [SUPABASE FALLBACK] Mock auth.getSession called');
        return await mockAuthService.getSession();
      },
      getUser: async () => {
        console.log('🔐 [SUPABASE FALLBACK] Mock auth.getUser called');
        return await mockAuthService.getUser();
      },
      onAuthStateChange: (callback: any) => {
        console.log('🔐 [SUPABASE FALLBACK] Mock auth.onAuthStateChange called');
        return mockAuthService.onAuthStateChange(callback);
      }
    },
    from: (table: string) => mockAuthService.from(table),
    supabaseUrl: 'mock://localhost',
    supabaseKey: 'mock-key'
  };
} else {
  // Use real Supabase client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseKey);
}

export const supabase = supabaseClient;

// Database table names (same as original)
export const TABLES = {
  // Core tables
  MERCHANT_PROFILES: "app_92a6ca4590_merchant_profiles",
  USER_SETTINGS: "app_92a6ca4590_user_settings",
  ROLES: "app_92a6ca4590_roles",
  PERMISSIONS: "app_92a6ca4590_permissions",
  ROLE_PERMISSIONS: "app_92a6ca4590_role_permissions",
  USER_ROLES: "app_92a6ca4590_user_roles",
  OUTLETS: "app_92a6ca4590_outlets",
  QR_CODES: "app_92a6ca4590_qr_codes",
  AI_TEMPLATES: "app_92a6ca4590_ai_templates",
  REVIEW_SESSIONS: "app_92a6ca4590_review_sessions",
  INCENTIVES: "app_92a6ca4590_incentives",
  CAMPAIGNS: "app_92a6ca4590_campaigns",
  CAMPAIGN_OUTLETS: "app_92a6ca4590_campaign_outlets",
  AUDIT_LOGS: "app_92a6ca4590_audit_logs",
  
  // Security tables
  RATE_LIMITS: "app_92a6ca4590_rate_limits",
  SECURITY_EVENTS: "app_92a6ca4590_security_events",
  LOGIN_HISTORY: "app_92a6ca4590_login_history"
};

// Define serverless function names
export const FUNCTIONS = {
  CREATE_DEMO_ACCOUNT: "create-demo-account",
  CHECK_PERMISSION: useMockAuth ? "mock://check-permission" : `${supabaseClient.supabaseUrl}/functions/v1/app_92a6ca4590_check_permission`,
  MANAGE_USER_ROLE: useMockAuth ? "mock://manage-user-role" : `${supabaseClient.supabaseUrl}/functions/v1/app_92a6ca4590_manage_user_role`
};

// Export utility functions
export function isSupabaseConfigured(): boolean {
  return !useMockAuth;
}

export async function testSupabaseConnection() {
  if (useMockAuth) {
    return {
      success: true,
      message: 'Using mock authentication service',
      mode: 'mock'
    };
  }
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return {
      success: !error,
      message: error ? error.message : 'Connection successful',
      mode: 'real'
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      mode: 'real'
    };
  }
}