# Supabase Edge Functions Documentation

## Overview

This document explains the two Supabase Edge Functions that have been implemented for the Vuebie application:

1. **Security Alert Monitor**: Monitors the `app_2d776e4976_security_events` table and sends email alerts for HIGH or CRITICAL severity security events.
2. **Rate Limit Cleanup**: Runs daily to delete `app_2d776e4976_rate_limits` records older than 24 hours.

## Tables Created

The following tables have been created to support these functions:

### Security Events Table
```sql
app_2d776e4976_security_events
```
- Stores security-related events with severity levels
- Fields: id, event_type, severity, details, user_id, ip_address, timestamp, processed

### Security Notifications Table
```sql
app_2d776e4976_security_notifications
```
- Records notifications sent for security events
- Fields: id, security_event_id, recipient_email, sent_at, status, error_message

### Notification Settings Table
```sql
app_2d776e4976_notification_settings
```
- Stores admin email addresses for receiving security alerts
- Fields: id, email, notify_severity, enabled, created_at, updated_at

## 1. Security Alert Monitor

**Edge Function: `app_2d776e4976_security_alert_monitor`**

This function monitors the `app_2d776e4976_security_events` table for HIGH or CRITICAL severity events and sends email alerts to configured administrators.

### How it Works

1. The function queries the `app_2d776e4976_security_events` table for unprocessed HIGH/CRITICAL events
2. It checks the `app_2d776e4976_notification_settings` table to determine who should receive alerts
3. It sends emails to appropriate recipients based on their notification preferences
4. It records sent notifications in the `app_2d776e4976_security_notifications` table
5. It marks processed events as `processed = true`

### Usage

This function can be triggered manually or set up as a scheduled function using Supabase Hooks:

```bash
# Manual invocation
curl -X POST 'https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_security_alert_monitor' \
  -H 'Authorization: Bearer [ANON_KEY]'
```

### Adding an Admin to Receive Alerts

```sql
INSERT INTO app_2d776e4976_notification_settings 
  (email, notify_severity, enabled)
VALUES 
  ('admin@example.com', ARRAY['HIGH', 'CRITICAL'], true);
```

### Logging a Security Event

```typescript
// Example code to log a security event from your application
const { data, error } = await supabase
  .from('app_2d776e4976_security_events')
  .insert({
    event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    severity: 'HIGH',
    details: { 
      location: 'login_page',
      attempt_count: 5,
      target_user: 'john.doe@example.com'
    },
    user_id: userId, // optional
    ip_address: '192.168.1.1' // optional
  });
```

## 2. Rate Limit Cleanup

**Edge Function: `app_2d776e4976_cleanup_rate_limits`**

This function removes old records from the `app_2d776e4976_rate_limits` table to prevent excessive data accumulation.

### How it Works

1. The function calculates a cutoff timestamp (default: 24 hours ago)
2. It deletes all rate limit records older than this timestamp
3. It logs a security event of LOW severity to record the cleanup operation

### Usage

This function can be triggered manually or set up as a scheduled function using Supabase Hooks:

```bash
# Manual invocation with default 24-hour retention
curl -X POST 'https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_cleanup_rate_limits' \
  -H 'Authorization: Bearer [ANON_KEY]'

# With custom retention period (in hours)
curl -X POST 'https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_cleanup_rate_limits' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"retentionHours": 48}'
```

## Setting Up Scheduled Execution

For optimal operation, these functions should be scheduled to run automatically:

1. **Security Alert Monitor**: Every 5-15 minutes to ensure timely alerts
2. **Rate Limit Cleanup**: Once daily (recommended during low-traffic hours)

### Using GitHub Actions or External Scheduler

You can set up a scheduler using GitHub Actions or another external service to invoke these functions on a schedule:

```yaml
# Example GitHub Actions workflow
name: Scheduled Functions

on:
  schedule:
    # Run security monitor every 15 minutes
    - cron: '*/15 * * * *'
    # Run cleanup at 2am daily
    - cron: '0 2 * * *'

jobs:
  security-monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Security Alert Monitor
        run: |
          curl -X POST 'https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_security_alert_monitor' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'

  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Rate Limit Cleanup
        run: |
          curl -X POST 'https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_2d776e4976_cleanup_rate_limits' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

## Email Configuration

To ensure emails are properly sent, configure the following environment variables in your Supabase project:

- `SMTP_HOST`: Your SMTP server hostname
- `SMTP_PORT`: SMTP server port (usually 587 or 465)
- `SMTP_SECURE`: Set to 'true' for SSL/TLS, 'false' for STARTTLS
- `SMTP_USER`: SMTP username/email
- `SMTP_PASSWORD`: SMTP password
- `SMTP_FROM`: Sender email address

## Testing the Functions

You can test these functions by:

1. **Security Alert Monitor**: Insert a test security event with HIGH severity and ensure it triggers an email
2. **Rate Limit Cleanup**: Insert test rate limit records with old timestamps and verify they get cleaned up

### Test Security Events
```sql
-- Insert a test HIGH severity event
INSERT INTO app_2d776e4976_security_events
  (event_type, severity, details, processed)
VALUES
  ('TEST_ALERT', 'HIGH', '{"test": true, "message": "This is a test alert"}', false);
```

### Test Rate Limit Records
```sql
-- Insert an old rate limit record
INSERT INTO app_2d776e4976_rate_limits
  (identifier, action, created_at)
VALUES
  ('test_user', 'test_action', (NOW() - INTERVAL '25 HOURS'));
```

## Troubleshooting

If you encounter issues with these functions, check:

1. **Function Logs**: View function execution logs in the Supabase dashboard
2. **Email Configuration**: Ensure SMTP settings are correctly configured
3. **Permissions**: Verify that the Row-Level Security policies are not preventing data access
4. **Table Structure**: Confirm all required tables exist with the correct schemas