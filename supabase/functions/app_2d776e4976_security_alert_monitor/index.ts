import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

// Environment variables provided by Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// Email configuration
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.example.com';
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
const SMTP_SECURE = Deno.env.get('SMTP_SECURE') !== 'false'; // Default to true
const SMTP_USER = Deno.env.get('SMTP_USER') || 'user@example.com';
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || 'password';
const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'security@vuebie.com';

// Function to send email alert
async function sendEmailAlert(recipients: string[], event: any) {
  try {
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      }
    });

    // Format event details for email body
    const eventDetails = JSON.stringify(event.details, null, 2);
    const userInfo = event.user_id ? `User ID: ${event.user_id}` : 'No user associated';
    const ipInfo = event.ip_address ? `IP Address: ${event.ip_address}` : 'No IP address recorded';
    
    // Create HTML email content
    const htmlContent = `
      <h2>⚠️ Security Alert: ${event.severity} Security Event Detected</h2>
      <p><strong>Event Type:</strong> ${event.event_type}</p>
      <p><strong>Severity:</strong> ${event.severity}</p>
      <p><strong>Timestamp:</strong> ${new Date(event.timestamp).toLocaleString()}</p>
      <p><strong>${userInfo}</strong></p>
      <p><strong>${ipInfo}</strong></p>
      <h3>Event Details:</h3>
      <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${eventDetails}</pre>
      <hr>
      <p>This is an automated message from the Vuebie Security Monitoring System. Please investigate this alert immediately.</p>
    `;
    
    // Send email to each recipient
    const emailPromises = recipients.map(recipient => {
      return transporter.sendMail({
        from: `"Vuebie Security" <${SMTP_FROM}>`,
        to: recipient,
        subject: `[ALERT] ${event.severity} Security Event - ${event.event_type}`,
        html: htmlContent,
      });
    });
    
    return await Promise.all(emailPromises);
  } catch (error) {
    console.error('Failed to send email alert:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Generate request ID for logging
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Security alert monitor triggered: ${req.method}`);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find unprocessed HIGH or CRITICAL security events
    const { data: securityEvents, error: eventsError } = await supabase
      .from('app_2d776e4976_security_events')
      .select('*')
      .in('severity', ['HIGH', 'CRITICAL'])
      .eq('processed', false)
      .order('timestamp', { ascending: false });

    if (eventsError) {
      console.error(`[${requestId}] Error fetching security events: ${JSON.stringify(eventsError)}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch security events', details: eventsError }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`[${requestId}] Found ${securityEvents?.length || 0} unprocessed HIGH/CRITICAL security events`);
    
    if (!securityEvents || securityEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No unprocessed high severity security events found' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Get notification recipients
    const { data: notificationSettings, error: settingsError } = await supabase
      .from('app_2d776e4976_notification_settings')
      .select('*')
      .eq('enabled', true);

    if (settingsError) {
      console.error(`[${requestId}] Error fetching notification settings: ${JSON.stringify(settingsError)}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notification settings', details: settingsError }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    if (!notificationSettings || notificationSettings.length === 0) {
      console.log(`[${requestId}] No notification recipients configured`);
      return new Response(
        JSON.stringify({ message: 'No notification recipients configured' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Process each security event
    const results = [];
    
    for (const event of securityEvents) {
      try {
        // Find recipients who should be notified of this severity level
        const recipients = notificationSettings
          .filter(setting => setting.notify_severity.includes(event.severity))
          .map(setting => setting.email);
        
        if (recipients.length === 0) {
          console.log(`[${requestId}] No recipients configured for ${event.severity} severity`);
          continue;
        }

        console.log(`[${requestId}] Sending alert for event ${event.id} to ${recipients.length} recipients`);
        
        // Send email alert
        const emailResults = await sendEmailAlert(recipients, event);
        
        // Mark notifications as sent in the database
        const notificationRecords = recipients.map(email => ({
          security_event_id: event.id,
          recipient_email: email,
          status: 'SENT',
          sent_at: new Date().toISOString()
        }));
        
        const { error: notificationError } = await supabase
          .from('app_2d776e4976_security_notifications')
          .insert(notificationRecords);
        
        if (notificationError) {
          console.error(`[${requestId}] Error recording notifications: ${JSON.stringify(notificationError)}`);
        }
        
        // Mark the event as processed
        const { error: updateError } = await supabase
          .from('app_2d776e4976_security_events')
          .update({ processed: true })
          .eq('id', event.id);
        
        if (updateError) {
          console.error(`[${requestId}] Error marking event as processed: ${JSON.stringify(updateError)}`);
        }
        
        results.push({
          event_id: event.id,
          recipients: recipients.length,
          status: 'processed'
        });
      } catch (error) {
        console.error(`[${requestId}] Error processing event ${event.id}: ${error instanceof Error ? error.message : String(error)}`);
        
        results.push({
          event_id: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        processed_events: results.length,
        results: results
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        message: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});