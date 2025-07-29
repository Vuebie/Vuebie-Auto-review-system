-- Permission metrics tables for storing historical data
-- To be executed in Supabase SQL Editor

-- Table for storing permission metrics
CREATE TABLE IF NOT EXISTS public.permission_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  metrics_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing alerts
CREATE TABLE IF NOT EXISTS public.permission_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_permission_metrics_timestamp 
ON public.permission_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_permission_alerts_timestamp 
ON public.permission_alerts(timestamp);

CREATE INDEX IF NOT EXISTS idx_permission_alerts_acknowledged 
ON public.permission_alerts(acknowledged);

-- Enable Row Level Security
ALTER TABLE public.permission_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for super_admin access
CREATE POLICY "Super admins can do all on metrics" 
ON public.permission_metrics
USING (auth.jwt() ->> 'app_metadata' ? 'super_admin')
WITH CHECK (auth.jwt() ->> 'app_metadata' ? 'super_admin');

CREATE POLICY "Super admins can do all on alerts" 
ON public.permission_alerts
USING (auth.jwt() ->> 'app_metadata' ? 'super_admin')
WITH CHECK (auth.jwt() ->> 'app_metadata' ? 'super_admin');

-- Create policies for admin read access
CREATE POLICY "Admins can read metrics" 
ON public.permission_metrics
FOR SELECT
USING (auth.jwt() ->> 'app_metadata' ? 'admin');

CREATE POLICY "Admins can read and update alerts" 
ON public.permission_alerts
USING (auth.jwt() ->> 'app_metadata' ? 'admin')
WITH CHECK (auth.jwt() ->> 'app_metadata' ? 'admin');