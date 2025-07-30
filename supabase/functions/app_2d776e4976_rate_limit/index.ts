import { createClient } from 'npm:@supabase/supabase-js@2';

// Important: Define the request interface for proper typing
interface RateLimitRequest {
  identifier: string;   // Usually user ID or IP address
  action: string;       // The action being rate limited (e.g., 'login', 'password_reset')
  maxAttempts: number;  // Maximum number of attempts allowed
  windowSeconds: number; // Time window for rate limiting in seconds
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

Deno.serve(async (req) => {
  // Generate request ID for logging
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Rate limit check requested: ${req.method}`);

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

  // Verify the request is a POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    // Parse request body
    let body: RateLimitRequest;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Validate required fields
    const { identifier, action, maxAttempts, windowSeconds } = body;
    if (!identifier || !action || !maxAttempts || !windowSeconds) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`[${requestId}] Rate limit parameters: ${JSON.stringify({
      identifier,
      action,
      maxAttempts,
      windowSeconds
    })}`);

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate the start of the time window
    const windowStart = new Date();
    windowStart.setSeconds(windowStart.getSeconds() - windowSeconds);
    const windowStartISOString = windowStart.toISOString();

    // Count recent attempts in the time window
    const { data: attempts, error } = await supabase
      .from('app_2d776e4976_rate_limits')
      .select('created_at')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStartISOString);

    if (error) {
      console.error(`[${requestId}] Database error: ${JSON.stringify(error)}`);
      throw error;
    }

    const attemptCount = attempts?.length || 0;
    const limited = attemptCount >= maxAttempts;
    const remainingAttempts = Math.max(0, maxAttempts - attemptCount);

    // Record this attempt if not already limited
    if (!limited) {
      const { error: insertError } = await supabase
        .from('app_2d776e4976_rate_limits')
        .insert({
          identifier,
          action,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`[${requestId}] Error recording attempt: ${JSON.stringify(insertError)}`);
      }
    }

    // Calculate reset time for when the rate limit will expire
    let resetTime = new Date().toISOString();
    if (attempts && attempts.length > 0) {
      // Sort attempts by timestamp ascending
      const sortedAttempts = [...attempts].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const oldestAttempt = new Date(sortedAttempts[0].created_at);
      resetTime = new Date(oldestAttempt.getTime() + windowSeconds * 1000).toISOString();
    }

    console.log(`[${requestId}] Rate limit result: limited=${limited}, remaining=${remainingAttempts}`);

    return new Response(
      JSON.stringify({ 
        limited, 
        remainingAttempts, 
        resetTime,
        totalAttempts: attemptCount
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