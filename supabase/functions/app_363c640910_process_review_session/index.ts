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

// Generate a unique code for incentives
function generateIncentiveCode(prefix = '') {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 8;
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return `${prefix}${prefix ? '-' : ''}${code}`;
}

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
    const { 
      sessionId, 
      qrCodeId, 
      outletId,
      merchantId, 
      deviceFingerprint, 
      sessionLanguage,
      reviewText,
      reviewPosted = false,
      requestIncentive = false
    } = body;
    
    if (!qrCodeId || !outletId || !merchantId || !deviceFingerprint || !sessionLanguage) {
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

    console.log(`[${requestId}] Processing review session for QR: ${qrCodeId}, outlet: ${outletId}`);

    // If sessionId is provided, update the existing session
    if (sessionId) {
      const { data: existingSession, error: fetchError } = await supabase
        .from('app_363c640910_review_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError || !existingSession) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { 
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (reviewText) {
        updateData.review_text = reviewText;
      }

      if (reviewPosted !== undefined) {
        updateData.review_posted = reviewPosted;
      }

      // Process incentive if requested and review is posted
      let incentiveData = null;
      if (requestIncentive && reviewPosted) {
        // Check if incentive already claimed for this session
        if (existingSession.incentive_claimed) {
          return new Response(
            JSON.stringify({ 
              error: 'Incentive already claimed for this session',
              session: existingSession
            }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // Get the active incentive for this merchant
        const { data: incentive, error: incentiveError } = await supabase
          .from('app_363c640910_incentives')
          .select('*')
          .eq('merchant_id', merchantId)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!incentiveError && incentive) {
          // Generate a unique code for the incentive
          const incentiveCode = generateIncentiveCode(incentive.code_prefix);
          updateData.incentive_id = incentive.id;
          updateData.incentive_claimed = true;
          updateData.incentive_code = incentiveCode;
          incentiveData = {
            ...incentive,
            code: incentiveCode
          };
        }
      }

      // Update the session
      const { data: updatedSession, error: updateError } = await supabase
        .from('app_363c640910_review_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        console.error(`[${requestId}] Error updating session:`, updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update session', details: updateError.message }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          session: updatedSession,
          incentive: incentiveData
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } else {
      // Create a new session
      const newSession = {
        qr_code_id: qrCodeId,
        outlet_id: outletId,
        merchant_id: merchantId,
        device_fingerprint: deviceFingerprint,
        session_language: sessionLanguage,
        review_text: reviewText || null,
        review_posted: reviewPosted || false
      };

      const { data: createdSession, error: createError } = await supabase
        .from('app_363c640910_review_sessions')
        .insert(newSession)
        .select()
        .single();

      if (createError) {
        console.error(`[${requestId}] Error creating session:`, createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: createError.message }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ session: createdSession }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
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