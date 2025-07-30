import { supabase } from "./supabase-client";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar_url?: string;
  role?: string;
  business_id?: string;
  business_name?: string;
};

export type AuthError = {
  message: string;
  status?: number;
};

export async function signInWithEmail(email: string, password: string): Promise<{
  user: UserProfile | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    
    if (!data.user) {
      return { user: null, error: { message: "No user returned after login" } };
    }
    
    try {
      const userProfile = await fetchUserProfile(data.user.id);
      return { user: userProfile, error: null };
    } catch (profileError) {
      throw new Error(`Authentication succeeded but profile fetch failed: ${profileError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sign in";
    const errorStatus = (error as { status?: number })?.status;
    
    return {
      user: null,
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function signInWithProvider(provider: "google" | "github"): Promise<{
  error: AuthError | null;
}> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to sign in with ${provider}`;
    const errorStatus = (error as { status?: number })?.status;
    return {
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{
  user: UserProfile | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;

    if (!data.user) {
      return { user: null, error: { message: "No user returned after signup" } };
    }

    // Create user profile in profiles table
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: "customer", // Default role
      },
    ]);

    if (profileError) throw profileError;

    // Return user info
    return {
      user: {
        id: data.user.id,
        firstName,
        lastName,
        email,
        role: "customer",
      },
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sign up";
    const errorStatus = (error as { status?: number })?.status;
    return {
      user: null,
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function signOut(): Promise<{
  error: AuthError | null;
}> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sign out";
    const errorStatus = (error as { status?: number })?.status;
    return {
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
    const errorStatus = (error as { status?: number })?.status;
    return {
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function updatePassword(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update password";
    const errorStatus = (error as { status?: number })?.status;
    return {
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<{
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }>
): Promise<{
  user: UserProfile | null;
  error: AuthError | null;
}> {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) throw error;

    const userProfile = await fetchUserProfile(userId);
    return { user: userProfile, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
    const errorStatus = (error as { status?: number })?.status;
    return {
      user: null,
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

export async function fetchUserProfile(
  userId: string
): Promise<UserProfile> {
  // First try to get merchant profile
  const { data: merchantProfile, error: merchantError } = await supabase
    .from("app_92a6ca4590_merchant_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (merchantProfile) {
    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("app_92a6ca4590_user_roles")
      .select("role:role_id(name)")
      .eq("user_id", userId);
    
    // Get user data from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    const email = userData?.user?.email || '';
    const roles = userRoles?.map(r => r.role.name) || [];
    const role = roles.includes('super_admin') ? 'super_admin' : 
                roles.includes('admin') ? 'admin' : 
                roles.includes('merchant') ? 'merchant' : 'customer';
    
    return {
      id: userId,
      firstName: merchantProfile.contact_name || 'User',
      lastName: '',
      email: email,
      avatar_url: null,
      role: role,
      business_id: merchantProfile.id,
      business_name: merchantProfile.business_name,
    };
  }
  
  // If no merchant profile, try to get from legacy profiles table
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, avatar_url, role, business_id, businesses(name)"
    )
    .eq("id", userId)
    .single();

  if (error) {
    // If no profile found in either table, get user data from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }
    
    if (!userData || !userData.user) {
      throw new Error(`User ID not found: ${userId}`);
    }
    
    // Create minimal profile with available data
    return {
      id: userId,
      firstName: 'User',
      lastName: '',
      email: userData.user.email || '',
      avatar_url: null,
      role: 'customer', // Default role
      business_id: undefined,
      business_name: undefined,
    };
  }

  if (!data) {
    throw new Error(`No profile found for user ID: ${userId}`);
  }

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    avatar_url: data.avatar_url,
    role: data.role,
    business_id: data.business_id,
    business_name: data.businesses?.name,
  };
}

export async function getCurrentUser(): Promise<{
  user: UserProfile | null;
  error: AuthError | null;
}> {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }
    
    if (!sessionData.session) {
      return { user: null, error: null }; // No error, but no user either
    }
    
    try {
      const userProfile = await fetchUserProfile(sessionData.session.user.id);
      return { user: userProfile, error: null };
    } catch (profileError) {
      
      // Create a minimal user object with data from the session
      const sessionUser = sessionData.session.user;
      const minimalUser: UserProfile = {
        id: sessionUser.id,
        firstName: 'User',
        lastName: '',
        email: sessionUser.email || '',
        avatar_url: null,
        role: 'customer', // Default role
      };
      
      return { 
        user: minimalUser, 
        error: { 
          message: "Session exists but profile fetch failed",
          status: 200 // Partial success
        }
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get current user";
    const errorStatus = (error as { status?: number })?.status;
    return {
      user: null,
      error: {
        message: errorMessage,
        status: errorStatus,
      },
    };
  }
}

// SECURITY: Admin functions have been removed from client-side code
// These functions should only exist in secure backend/Edge Functions
// Demo account creation has been moved to development utilities only