import { createClient } from 'npm:@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique request ID
function generateRequestId() {
  return crypto.randomUUID();
}

// Rate limit configurations from stakeholder requirements
const RATE_LIMITS = {
  qr_scan: { maxCount: 5, periodHours: 24 },        // Max 5 scans per device per outlet per 24 hours
  review_session: { maxCount: 3, periodHours: 24 }, // Max 3 review/incentive claims per device per day
  incentive_claim: { maxCount: 1, periodHours: 24 } // 1 claim per device per QR code
};

serve(async (req) => {
  // Generate a request ID for tracking
  const requestId = generateRequestId();
  console.log(`[${requestId}] Received request: ${req.method}`);
  
  // Handle CORS preflight
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { deviceFingerprint, outletId, qrCodeId, actionType } = body;
    
    if (!deviceFingerprint || !outletId || !actionType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate action type
    if (!RATE_LIMITS[actionType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid action type' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`[${requestId}] Checking rate limits for ${actionType}, device: ${deviceFingerprint}`);

    // For incentive claims, qrCodeId is required
    if (actionType === 'incentive_claim' && !qrCodeId) {
      return new Response(
        JSON.stringify({ error: 'QR code ID is required for incentive claims' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get the rate limit entry if it exists
    const { data: rateLimitEntry, error: fetchError } = await supabase
      .from('app_363c640910_rate_limits')
      .select('*')
      .eq('device_fingerprint', deviceFingerprint)
      .eq('outlet_id', outletId)
      .eq('action_type', actionType)
      .eq('qr_code_id', qrCodeId || null)
      .single();

    // Set cutoff time for the rate limit period
    const limitConfig = RATE_LIMITS[actionType];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - limitConfig.periodHours);
    const cutoffTimeISO = cutoffTime.toISOString();

    let isAllowed = true;
    let message = '';
    let currentCount = 1;

    if (rateLimitEntry && !fetchError) {
      // Check if last action is within the rate limit period
      if (new Date(rateLimitEntry.last_action_at) > cutoffTime) {
        // Still within the period, increment count and check against limit
        currentCount = rateLimitEntry.action_count + 1;
        
        if (currentCount > limitConfig.maxCount) {
          isAllowed = false;
          message = `Rate limit exceeded for ${actionType}. Please try again later.`;
        }
      } else {
        // Outside the period, reset count
        currentCount = 1;
      }

      // Update the rate limit entry
      if (isAllowed) {
        const { error: updateError } = await supabase
          .from('app_363c640910_rate_limits')
          .update({ 
            action_count: currentCount,
            last_action_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', rateLimitEntry.id);

        if (updateError) {
          console.error(`[${requestId}] Error updating rate limit:`, updateError);
        }
      }
    } else {
      // Create a new rate limit entry
      const { error: insertError } = await supabase
        .from('app_363c640910_rate_limits')
        .insert({
          device_fingerprint: deviceFingerprint,
          outlet_id: outletId,
          qr_code_id: qrCodeId || null,
          action_type: actionType,
          action_count: 1,
          last_action_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`[${requestId}] Error creating rate limit:`, insertError);
      }
    }

    console.log(`[${requestId}] Rate limit check complete: allowed=${isAllowed}, count=${currentCount}/${limitConfig.maxCount}`);

    return new Response(
      JSON.stringify({ 
        allowed: isAllowed,
        message: message || `Action allowed. Count: ${currentCount}/${limitConfig.maxCount}`,
        count: currentCount,
        maxCount: limitConfig.maxCount,
        resetAfter: limitConfig.periodHours
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});