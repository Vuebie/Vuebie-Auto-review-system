// User Role Management Edge Function
// Handles assigning and removing user roles securely

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
  console.log(`[${requestId}] User role management request: ${req.method}`);
  
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
    
    const { operation, adminUserId, targetUserId, roleName } = body;
    
    // Validate required parameters
    if (!operation || !adminUserId || !targetUserId || !roleName) {
      console.error(`[${requestId}] Missing required parameters`);
      return new Response(JSON.stringify({
        error: "Missing required parameters: operation, adminUserId, targetUserId, and roleName are required",
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin user exists and has admin permissions
    const { data: adminData, error: adminError } = await supabase.auth.admin.getUserById(adminUserId);
    if (adminError || !adminData.user) {
      console.error(`[${requestId}] Admin user not found:`, adminError);
      return new Response(JSON.stringify({
        error: "Admin user not found",
        requestId
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin's permissions using the database function
    const { data: permissionData, error: permissionError } = await supabase.rpc(
      'app_0be8fb8541_get_user_effective_permissions',
      { p_user_id: adminUserId }
    );

    if (permissionError) {
      console.error(`[${requestId}] Error checking admin permissions:`, permissionError);
      return new Response(JSON.stringify({
        error: "Error checking admin permissions",
        details: permissionError.message,
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find if admin has user management permissions
    const userManagementPermissions = permissionData.find((p) => p.resource === 'users');
    const canManageUsers = userManagementPermissions ? 
      (userManagementPermissions.actions.includes('update') || 
       userManagementPermissions.actions.includes('manage_roles')) : 
      false;

    if (!canManageUsers) {
      console.log(`[${requestId}] Permission denied: admin user ${adminUserId} does not have user management permissions`);
      return new Response(JSON.stringify({
        error: "Permission denied: you do not have permission to manage user roles",
        requestId
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if target user exists
    const { data: targetData, error: targetError } = await supabase.auth.admin.getUserById(targetUserId);
    if (targetError || !targetData.user) {
      console.error(`[${requestId}] Target user not found:`, targetError);
      return new Response(JSON.stringify({
        error: "Target user not found",
        requestId
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if the role exists
    const { data: roleData, error: roleError } = await supabase
      .from('app_0be8fb8541_roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !roleData) {
      console.error(`[${requestId}] Role not found:`, roleError);
      return new Response(JSON.stringify({
        error: `Role '${roleName}' not found`,
        requestId
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    if (operation === 'assign') {
      // Assign role to user
      const { data: existingRole } = await supabase
        .from('app_0be8fb8541_user_roles')
        .select()
        .eq('user_id', targetUserId)
        .eq('role_id', roleData.id)
        .maybeSingle();

      if (!existingRole) {
        const { data, error } = await supabase
          .from('app_0be8fb8541_user_roles')
          .insert({
            user_id: targetUserId,
            role_id: roleData.id,
          })
          .select();

        if (error) {
          console.error(`[${requestId}] Error assigning role:`, error);
          return new Response(JSON.stringify({
            error: `Error assigning role: ${error.message}`,
            requestId
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = data;
      } else {
        // Role already assigned
        result = { message: `Role '${roleName}' already assigned to user` };
      }

      // Log the action
      await supabase
        .from('app_0be8fb8541_audit_logs')
        .insert({
          user_id: adminUserId,
          action_type: 'ROLE_ASSIGNED',
          resource_type: 'USER_ROLE',
          resource_id: targetUserId,
          details: { 
            role_name: roleName,
            request_id: requestId
          }
        });

    } else if (operation === 'remove') {
      // Remove role from user
      const { data, error } = await supabase
        .from('app_0be8fb8541_user_roles')
        .delete()
        .match({
          user_id: targetUserId,
          role_id: roleData.id,
        })
        .select();

      if (error) {
        console.error(`[${requestId}] Error removing role:`, error);
        return new Response(JSON.stringify({
          error: `Error removing role: ${error.message}`,
          requestId
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (data && data.length > 0) {
        result = { message: `Role '${roleName}' removed from user` };
        
        // Log the action
        await supabase
          .from('app_0be8fb8541_audit_logs')
          .insert({
            user_id: adminUserId,
            action_type: 'ROLE_REMOVED',
            resource_type: 'USER_ROLE',
            resource_id: targetUserId,
            details: { 
              role_name: roleName,
              request_id: requestId
            }
          });
      } else {
        result = { message: `User did not have role '${roleName}'` };
      }
    } else {
      return new Response(JSON.stringify({
        error: `Invalid operation: ${operation}. Must be 'assign' or 'remove'`,
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      result,
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