import { createClient } from '@supabase/supabase-js';

// Supabase configuration - trying both naming conventions for maximum compatibility
const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure environment variables are provided
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Missing Supabase environment variables. Check your .env file.');
  throw new Error('Missing required Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names
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
  CHECK_PERMISSION: `${supabaseUrl}/functions/v1/app_92a6ca4590_check_permission`,
  MANAGE_USER_ROLE: `${supabaseUrl}/functions/v1/app_92a6ca4590_manage_user_role`
};

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
  return Boolean(supabaseUrl && supabaseKey);
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase.from(TABLES.MERCHANT_PROFILES).select('count(*)');
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}