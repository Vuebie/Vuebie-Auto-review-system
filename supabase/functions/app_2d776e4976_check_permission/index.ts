import { createClient } from 'npm:@supabase/supabase-js@2';

// Environment variables provided by Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// Define the request interface
interface PermissionCheckRequest {
  resource: string;  // The resource being accessed
  action: string;    // The action being performed
  app_id?: string;   // Optional app ID for multi-tenant scenarios
}

Deno.serve(async (req) => {
  // Generate request ID for logging
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Permission check requested: ${req.method}`);

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
    // Get authorization token from headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const token = authHeader.substring(7);
    console.log(`[${requestId}] Token received, processing permission check`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user ID from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error(`[${requestId}] User validation error: ${JSON.stringify(userError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired token',
          hasPermission: false
        }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Parse request body
    let body: PermissionCheckRequest;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          hasPermission: false
        }),
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
    const { resource, action, app_id = '2d776e4976' } = body;
    if (!resource || !action) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          hasPermission: false 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`[${requestId}] Permission check for user ${user.id}: ${resource}:${action}`);

    // Check app_id matches current app
    if (app_id !== '2d776e4976') {
      console.error(`[${requestId}] App ID mismatch: ${app_id}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid app ID',
          hasPermission: false 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('app_2d776e4976_user_roles')
      .select('role:role_id(name, permissions)')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error(`[${requestId}] Error fetching roles: ${JSON.stringify(rolesError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Error checking permissions',
          hasPermission: false 
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

    // Get merchant profile for any business-specific permissions
    const { data: merchantProfile } = await supabase
      .from('app_2d776e4976_merchant_profiles')
      .select('business_id, subscription_tier')
      .eq('user_id', user.id)
      .single();
    
    let hasPermission = false;
    let roles = [];
    
    // Check permissions in each role
    if (userRoles && userRoles.length > 0) {
      roles = userRoles.map(r => r.role?.name || '').filter(Boolean);
      
      // Super admin can do anything
      if (roles.includes('super_admin')) {
        hasPermission = true;
      } 
      // Admin has broad access
      else if (roles.includes('admin') && resource !== 'system_settings') {
        hasPermission = true;
      }
      // Merchant permissions depend on subscription and resource
      else if (roles.includes('merchant')) {
        // Basic merchant permissions for their own resources
        if (['profile', 'outlets', 'qr_codes', 'reviews'].includes(resource)) {
          hasPermission = true;
        }
        
        // Check subscription tier for premium features
        const tier = merchantProfile?.subscription_tier || 'free';
        if (tier === 'premium' && ['campaigns', 'analytics', 'templates'].includes(resource)) {
          hasPermission = true;
        } else if (tier === 'pro' && ['all_features'].includes(resource)) {
          hasPermission = true;
        }
      }
      // Customer permissions
      else if (roles.includes('customer') && ['reviews', 'profile'].includes(resource)) {
        hasPermission = true;
      }
    }

    // Record permission check
    const { error: logError } = await supabase
      .from('app_2d776e4976_permission_logs')
      .insert({
        user_id: user.id,
        resource,
        action,
        granted: hasPermission,
        timestamp: new Date().toISOString(),
        user_roles: roles
      });

    if (logError) {
      console.error(`[${requestId}] Error logging permission check: ${JSON.stringify(logError)}`);
    }

    console.log(`[${requestId}] Permission result: ${hasPermission ? 'GRANTED' : 'DENIED'}`);

    return new Response(
      JSON.stringify({ 
        hasPermission,
        roles,
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
        message: error instanceof Error ? error.message : 'Internal server error',
        hasPermission: false
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