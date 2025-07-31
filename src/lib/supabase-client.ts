import { createClient } from '@supabase/supabase-js';

// Supabase configuration - loading from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta?.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta?.env?.VITE_SUPABASE_ANON_KEY;

// Ensure environment variables are provided
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env file.');
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  MERCHANT_PROFILES: 'app_92a6ca4590_merchant_profiles',
  USER_SETTINGS: 'app_92a6ca4590_user_settings',
  ROLES: 'app_92a6ca4590_roles',
  PERMISSIONS: 'app_92a6ca4590_permissions',
  ROLE_PERMISSIONS: 'app_92a6ca4590_role_permissions',
  USER_ROLES: 'app_92a6ca4590_user_roles',
  AUDIT_LOGS: 'app_92a6ca4590_audit_logs',
  OUTLETS: 'app_92a6ca4590_outlets',
  QR_CODES: 'app_92a6ca4590_qr_codes',
  AI_TEMPLATES: 'app_92a6ca4590_ai_templates',
  INCENTIVES: 'app_92a6ca4590_incentives',
  REVIEW_SESSIONS: 'app_92a6ca4590_review_sessions',
  RATE_LIMITS: 'app_92a6ca4590_rate_limits',
  CAMPAIGNS: 'app_92a6ca4590_campaigns',
  CAMPAIGN_OUTLETS: 'app_92a6ca4590_campaign_outlets'
};

// Supabase Edge Function URLs
export const FUNCTIONS = {
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
  phone?: string;
  website?: string;
  address?: string;
  subscription_tier: 'free' | 'basic' | 'premium';
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