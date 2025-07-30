-- Database Migration for Vuebie Security Enhancements
-- Date: July 31, 2025
-- This script creates new tables and modifies existing ones to support enhanced security features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Rate Limits table for tracking authentication attempts
-- This table is used for rate limiting login attempts, password resets, etc.
CREATE TABLE IF NOT EXISTS app_92a6ca4590_rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL, -- Email, IP address, or combination
  action TEXT NOT NULL,     -- The action being rate limited (login_attempt, reset_password, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add index for fast lookups by identifier and action
  CONSTRAINT rate_limits_identifier_action_idx UNIQUE(identifier, action, created_at)
);

-- Create index for fast cleanup of old rate limit records
CREATE INDEX IF NOT EXISTS rate_limits_created_at_idx ON app_92a6ca4590_rate_limits(created_at);

-- Create Security Events table for comprehensive security logging
-- This table stores all security-relevant events for auditing and analysis
CREATE TABLE IF NOT EXISTS app_92a6ca4590_security_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,  -- Type of security event (LOGIN_FAILED, SUSPICIOUS_LOGIN, etc.)
  severity TEXT NOT NULL,    -- Severity level (LOW, MEDIUM, HIGH, CRITICAL)
  user_id UUID REFERENCES auth.users(id),  -- User associated with the event, if applicable
  ip_address TEXT,           -- IP address from which the event originated
  user_agent TEXT,           -- User agent string
  url TEXT,                  -- URL at which the event occurred
  session_id TEXT,           -- Session identifier
  details JSONB,             -- Additional event details in JSON format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS security_events_user_id_idx ON app_92a6ca4590_security_events(user_id);
CREATE INDEX IF NOT EXISTS security_events_event_type_idx ON app_92a6ca4590_security_events(event_type);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON app_92a6ca4590_security_events(severity);
CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON app_92a6ca4590_security_events(created_at);

-- Create Login History table for tracking login attempts and patterns
-- This table is used for detecting suspicious login patterns
CREATE TABLE IF NOT EXISTS app_92a6ca4590_login_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- User who attempted login
  ip_address TEXT,           -- IP address from which the login was attempted
  user_agent TEXT,           -- User agent string
  location TEXT,             -- Approximate geographic location (city/country)
  success BOOLEAN NOT NULL DEFAULT true,  -- Whether the login attempt was successful
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for login history
CREATE INDEX IF NOT EXISTS login_history_user_id_idx ON app_92a6ca4590_login_history(user_id);
CREATE INDEX IF NOT EXISTS login_history_success_idx ON app_92a6ca4590_login_history(success);
CREATE INDEX IF NOT EXISTS login_history_created_at_idx ON app_92a6ca4590_login_history(created_at);

-- Add MFA and security-related fields to merchant profiles
ALTER TABLE app_92a6ca4590_merchant_profiles
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_method TEXT,
ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS security_level TEXT DEFAULT 'STANDARD';

-- Create view for suspicious activities
CREATE OR REPLACE VIEW app_92a6ca4590_suspicious_activities AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE severity = 'HIGH' OR severity = 'CRITICAL') AS high_severity_events,
  COUNT(*) FILTER (WHERE event_type = 'LOGIN_FAILED') AS failed_logins,
  COUNT(*) FILTER (WHERE event_type = 'SUSPICIOUS_LOGIN') AS suspicious_logins,
  COUNT(*) FILTER (WHERE event_type = 'PASSWORD_RESET_REQUESTED') AS password_resets,
  MAX(created_at) AS last_event_time
FROM 
  app_92a6ca4590_security_events
WHERE 
  created_at > NOW() - INTERVAL '7 days'
GROUP BY 
  user_id;

-- Create Row Level Security (RLS) policies
-- Enable RLS on security tables
ALTER TABLE app_92a6ca4590_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_92a6ca4590_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_92a6ca4590_login_history ENABLE ROW LEVEL SECURITY;

-- Create policy for security events - only admins can see all events
CREATE POLICY security_events_admin_policy ON app_92a6ca4590_security_events
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_92a6ca4590_user_roles ur 
      JOIN app_92a6ca4590_roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Users can only see their own security events
CREATE POLICY security_events_user_policy ON app_92a6ca4590_security_events
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create policy for login history - only admins can see all logins
CREATE POLICY login_history_admin_policy ON app_92a6ca4590_login_history
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_92a6ca4590_user_roles ur 
      JOIN app_92a6ca4590_roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Users can only see their own login history
CREATE POLICY login_history_user_policy ON app_92a6ca4590_login_history
  FOR SELECT 
  USING (user_id = auth.uid());

-- Rate limits are not accessible to regular users
CREATE POLICY rate_limits_admin_policy ON app_92a6ca4590_rate_limits
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_92a6ca4590_user_roles ur 
      JOIN app_92a6ca4590_roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Create function to clean up old rate limit records (runs daily)
CREATE OR REPLACE FUNCTION app_92a6ca4590_cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM app_92a6ca4590_rate_limits
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to reset failed login attempts after a time period
CREATE OR REPLACE FUNCTION app_92a6ca4590_reset_failed_logins()
RETURNS void AS $$
BEGIN
  UPDATE app_92a6ca4590_merchant_profiles
  SET failed_login_attempts = 0, account_locked = false, account_locked_until = NULL
  WHERE account_locked = true AND account_locked_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup function (this would typically be done through a cron job in production)
-- COMMENT OUT for database migrations, uncomment for direct database setup
-- SELECT cron.schedule('0 0 * * *', 'SELECT app_92a6ca4590_cleanup_rate_limits()');
-- SELECT cron.schedule('0 * * * *', 'SELECT app_92a6ca4590_reset_failed_logins()');

-- Add new security-related permissions
INSERT INTO app_92a6ca4590_permissions (role_id, resource, action, created_at)
SELECT 
  id, 'security_events', 'view', NOW()
FROM 
  app_92a6ca4590_roles 
WHERE 
  name IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;

INSERT INTO app_92a6ca4590_permissions (role_id, resource, action, created_at)
SELECT 
  id, 'security_settings', 'manage', NOW()
FROM 
  app_92a6ca4590_roles 
WHERE 
  name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Create view for security dashboard (admins)
CREATE OR REPLACE VIEW app_92a6ca4590_security_dashboard AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  event_type,
  severity,
  COUNT(*) AS event_count
FROM 
  app_92a6ca4590_security_events
WHERE 
  created_at > NOW() - INTERVAL '30 days'
GROUP BY 
  day, event_type, severity
ORDER BY 
  day DESC, severity DESC;

-- Create index for fast security event searching
CREATE INDEX IF NOT EXISTS security_events_details_idx ON app_92a6ca4590_security_events USING GIN (details);

-- Add comment to document the security schema
COMMENT ON TABLE app_92a6ca4590_security_events IS 'Stores security-relevant events for auditing, monitoring, and threat detection';
COMMENT ON TABLE app_92a6ca4590_rate_limits IS 'Tracks authentication attempts for rate limiting to prevent brute force attacks';
COMMENT ON TABLE app_92a6ca4590_login_history IS 'Records login attempts and patterns to detect suspicious activities';