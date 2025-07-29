// This is a Supabase Edge Function that enables leaked password protection
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// This function configures Supabase Auth to check passwords against known leaked databases
serve(async (req) => {
  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? ''
    )

    // Configure Auth settings to enable leaked password protection
    // In a real implementation, we would use the Supabase Management API
    // For demonstration purposes, we're using a direct API call
    
    const authConfigEndpoint = `${SUPABASE_URL}/auth/v1/admin/config`
    const authConfigResponse = await fetch(authConfigEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        security: {
          enable_leaked_password_protection: true
        }
      })
    })

    if (!authConfigResponse.ok) {
      const errorData = await authConfigResponse.json()
      throw new Error(`Failed to update Auth config: ${JSON.stringify(errorData)}`)
    }

    // Log this action
    await supabase
      .from('app_92a6ca4590_audit_logs')
      .insert([
        {
          user_id: 'system',
          action_type: 'security_update',
          resource_type: 'auth_settings',
          resource_id: null,
          details: {
            action: 'enable_leaked_password_protection',
            timestamp: new Date().toISOString(),
            success: true
          }
        }
      ])

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Leaked password protection enabled successfully',
        function_id: '249c1ff4-c729-40c4-8ce8-1d60441366f4',
        status: 'ACTIVE'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})