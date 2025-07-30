import { createClient } from 'npm:@supabase/supabase-js@2';

// Environment variables provided by Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

Deno.serve(async (req) => {
  // Generate request ID for logging
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Rate limit cleanup triggered: ${req.method}`);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
    });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Default retention period is 24 hours (86400 seconds)
    let retentionPeriod = 86400; // 24 hours in seconds
    
    // Check if a custom retention period was provided in the request
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body && typeof body.retentionHours === 'number' && body.retentionHours > 0) {
          retentionPeriod = body.retentionHours * 3600; // Convert hours to seconds
          console.log(`[${requestId}] Using custom retention period: ${body.retentionHours} hours`);
        }
      } catch (e) {
        // If parsing fails, use default retention period
        console.log(`[${requestId}] Failed to parse request body, using default retention period`);
      }
    }

    // Calculate the cutoff timestamp for deletion
    const cutoffDate = new Date();
    cutoffDate.setSeconds(cutoffDate.getSeconds() - retentionPeriod);
    const cutoffTimestamp = cutoffDate.toISOString();
    
    console.log(`[${requestId}] Deleting rate limit records older than: ${cutoffTimestamp}`);

    // Count records that will be deleted for logging purposes
    const { count, error: countError } = await supabase
      .from('app_2d776e4976_rate_limits')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffTimestamp);
    
    if (countError) {
      console.error(`[${requestId}] Error counting old records: ${JSON.stringify(countError)}`);
      throw countError;
    }
    
    console.log(`[${requestId}] Found ${count || 0} records to delete`);

    // Delete old rate limit records
    const { error: deleteError } = await supabase
      .from('app_2d776e4976_rate_limits')
      .delete()
      .lt('created_at', cutoffTimestamp);
    
    if (deleteError) {
      console.error(`[${requestId}] Error deleting old records: ${JSON.stringify(deleteError)}`);
      throw deleteError;
    }

    // Log security event for the cleanup operation
    const { error: logError } = await supabase
      .from('app_2d776e4976_security_events')
      .insert({
        event_type: 'RATE_LIMIT_CLEANUP',
        severity: 'LOW',
        details: {
          retention_period_seconds: retentionPeriod,
          cutoff_timestamp: cutoffTimestamp,
          records_deleted: count || 0
        },
        timestamp: new Date().toISOString()
      });
    
    if (logError) {
      console.error(`[${requestId}] Error logging security event: ${JSON.stringify(logError)}`);
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully deleted ${count || 0} rate limit records older than ${cutoffTimestamp}`,
        retention_period_hours: retentionPeriod / 3600,
        cutoff_timestamp: cutoffTimestamp,
        records_deleted: count || 0,
        timestamp: new Date().toISOString()
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