// Permission check edge function
// Used for server-side permission checks in critical operations

import { createClient } from 'npm:@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Generate request ID for tracing
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Permission check request: ${req.method}`);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // For non-OPTIONS requests, validate the request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ 
        error: "Method not allowed",
        requestId 
      }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing JSON body:`, parseError);
      return new Response(JSON.stringify({
        error: "Invalid JSON body",
        requestId
      }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { userId, resource, action } = body;
    
    // Validate required parameters
    if (!userId || !resource || !action) {
      console.error(`[${requestId}] Missing required parameters`);
      return new Response(JSON.stringify({
        error: "Missing required parameters: userId, resource, and action are required",
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      console.error(`[${requestId}] User not found:`, userError);
      return new Response(JSON.stringify({
        error: "User not found",
        requestId
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user's permissions using the database function
    const { data: permissionData, error: permissionError } = await supabase.rpc(
      'app_0be8fb8541_get_user_effective_permissions',
      { p_user_id: userId }
    );

    if (permissionError) {
      console.error(`[${requestId}] Error checking permissions:`, permissionError);
      return new Response(JSON.stringify({
        error: "Error checking permissions",
        details: permissionError.message,
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the specified resource in the user's permissions
    const resourcePermissions = permissionData.find((p) => p.resource === resource);
    const hasPermission = resourcePermissions ? resourcePermissions.actions.includes(action) : false;

    // Log the permission check result
    console.log(`[${requestId}] Permission check: user ${userId} ${hasPermission ? 'HAS' : 'DOES NOT HAVE'} ${action} permission on ${resource}`);
    
    // Log the permission check in the audit logs
    await supabase
      .from('app_0be8fb8541_audit_logs')
      .insert({
        user_id: userId,
        action_type: 'PERMISSION_CHECK',
        resource_type: resource,
        resource_id: null,
        details: {
          action,
          result: hasPermission,
          request_id: requestId,
        }
      })
      .select();

    // Return the permission check result
    return new Response(JSON.stringify({
      hasPermission,
      requestId
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message,
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});