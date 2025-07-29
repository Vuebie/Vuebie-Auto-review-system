// This file re-exports from supabase-client.ts for backward compatibility
// All new code should import from supabase-client.ts directly

import { supabase, TABLES as TableNames, FUNCTIONS } from './supabase-client';
export { supabase, TableNames, FUNCTIONS };

// Re-export all types
export type {
  Outlet,
  QRCode,
  AITemplate,
  Incentive,
  ReviewSession,
  UserRole,
  Role,
  MerchantProfile,
  UserSettings,
  Permission,
  RolePermission,
  AuditLog,
  Campaign,
  CampaignOutlet
} from './supabase-client';

// Legacy export for existing code - DO NOT USE IN NEW CODE
export const TABLES = TableNames;