import { createClient } from '@supabase/supabase-js';

// Supabase configuration - loading from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure environment variables are provided
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env file.');
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define table names in a central location for easy management
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

// Types for database tables
export interface Outlet {
  id: string;
  merchant_id: string;
  name: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  outlet_id: string;
  merchant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface AITemplate {
  id: string;
  merchant_id: string;
  name: string;
  prompt: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Incentive {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  type: 'voucher' | 'discount' | 'points' | 'lucky_draw' | 'free_item';
  code_prefix?: string;
  value?: number;
  expires_at?: string;
  active: boolean;
  min_rating?: number;
  min_review_length?: number;
  max_per_user?: number;
  redemption_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewSession {
  id: string;
  qr_code_id: string;
  outlet_id: string;
  merchant_id: string;
  device_fingerprint: string;
  session_language: string;
  review_text?: string;
  review_posted: boolean;
  incentive_id?: string;
  incentive_claimed: boolean;
  incentive_code?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  role?: string;
  mfa_enabled?: boolean;
  mfa_secret?: string;
  mfa_recovery_codes?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Campaign {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  active: boolean;
  incentive_id?: string;
  ai_template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignOutlet {
  id: string;
  campaign_id: string;
  outlet_id: string;
  created_at: string;
}

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