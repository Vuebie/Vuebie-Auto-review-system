import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ Missing Supabase environment variables. Check your .env file."
  );
}

// Define table names in a central location for easy management
export const TABLES = {
  // Existing tables
  MERCHANT_PROFILES: "app_92a6ca4590_merchant_profiles",
  USER_SETTINGS: "app_92a6ca4590_user_settings",
  ROLES: "app_92a6ca4590_roles",
  PERMISSIONS: "app_92a6ca4590_permissions",
  USER_ROLES: "app_92a6ca4590_user_roles",
  OUTLETS: "app_92a6ca4590_outlets",
  QR_CODES: "app_92a6ca4590_qr_codes",
  AI_TEMPLATES: "app_92a6ca4590_ai_templates",
  REVIEW_SESSIONS: "app_92a6ca4590_review_sessions",
  INCENTIVES: "app_92a6ca4590_incentives",
  CAMPAIGNS: "app_92a6ca4590_campaigns",
  CAMPAIGN_OUTLETS: "app_92a6ca4590_campaign_outlets",
  AUDIT_LOGS: "app_92a6ca4590_audit_logs",
  
  // New security tables
  RATE_LIMITS: "app_92a6ca4590_rate_limits",
  SECURITY_EVENTS: "app_92a6ca4590_security_events",
  LOGIN_HISTORY: "app_92a6ca4590_login_history"
};

// Define serverless function names
export const FUNCTIONS = {
  CREATE_DEMO_ACCOUNT: "create-demo-account",
  // Add other function names as needed
};

// Define table schemas and types
export interface RateLimit {
  id: string;
  identifier: string;
  action: string;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  url: string;
  session_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  location: string;
  success: boolean;
  created_at: string;
}

// Create a single Supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
);

/**
 * Get the current session with secure error handling
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  } catch (error) {
    console.error("Failed to get current session:", error);
    return null;
  }
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Check if user has permission for a resource/action
 */
export async function checkPermission(resource: string, action: string): Promise<boolean> {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return false;
    }
    
    // Get user's roles
    const { data: roles, error: rolesError } = await supabase
      .from(TABLES.USER_ROLES)
      .select(`
        ${TABLES.ROLES}!inner(*)
      `)
      .eq('user_id', userData.user.id);
      
    if (rolesError || !roles || roles.length === 0) {
      return false;
    }
    
    // Extract role IDs
    const roleIds = roles.map(r => r[TABLES.ROLES].id);
    
    // Check if any role has the required permission
    const { data: permissions, error: permissionsError } = await supabase
      .from(TABLES.PERMISSIONS)
      .select('*')
      .in('role_id', roleIds)
      .eq('resource', resource)
      .eq('action', action);
      
    if (permissionsError || !permissions || permissions.length === 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}