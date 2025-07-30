-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the Security Alert Monitor to run every 15 minutes
SELECT cron.schedule(
  'security-alerts', -- name of the cron job
  '*/15 * * * *',   -- schedule: every 15 minutes
  $$
  SELECT net.http_post(
    url:='https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_security_alert_monitor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bGRuZGhyb2JjYWVvZ21qZmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTQ1ODMsImV4cCI6MjA2OTE5MDU4M30.FNWRbVnKiJk859Zmhc_c3mo9OaKjGCGh2hpaHPiSPTY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Schedule the Rate Limit Cleanup to run daily at 2 AM
SELECT cron.schedule(
  'cleanup-rate-limits', -- name of the cron job
  '0 2 * * *',         -- schedule: at 2:00 AM every day
  $$
  SELECT net.http_post(
    url:='https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_cleanup_rate_limits',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bGRuZGhyb2JjYWVvZ21qZmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTQ1ODMsImV4cCI6MjA2OTE5MDU4M30.FNWRbVnKiJk859Zmhc_c3mo9OaKjGCGh2hpaHPiSPTY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Create a view to show scheduled jobs (for reference)
CREATE OR REPLACE VIEW app_2d776e4976_scheduled_jobs AS
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM 
  cron.job
WHERE
  jobname IN ('security-alerts', 'cleanup-rate-limits');

-- Grant permissions on the view to authenticated users
ALTER VIEW app_2d776e4976_scheduled_jobs OWNER TO postgres;
GRANT SELECT ON app_2d776e4976_scheduled_jobs TO authenticated;