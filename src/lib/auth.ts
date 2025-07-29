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

    if (error) throw error;

    if (!data.user) {
      return { user: null, error: { message: "No user returned after login" } };
    }

    const userProfile = await fetchUserProfile(data.user.id);
    return { user: userProfile, error: null };
  } catch (error) {
    console.error("Error signing in with email:", error);
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
    console.error("Error signing in with provider:", error);
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
    console.error("Error signing up:", error);
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
    console.error("Error signing out:", error);
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
    console.error("Error resetting password:", error);
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
    console.error("Error updating password:", error);
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
    console.error("Error updating profile:", error);
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
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, avatar_url, role, business_id, businesses(name)"
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    throw error;
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

    if (sessionError) throw sessionError;
    
    if (!sessionData.session) {
      return { user: null, error: null }; // No error, but no user either
    }

    const userProfile = await fetchUserProfile(sessionData.session.user.id);
    return { user: userProfile, error: null };
  } catch (error) {
    console.error("Error getting current user:", error);
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

export async function createDemoAccounts(
  type: "merchant" | "admin",
  count: number
): Promise<
  | {
      accounts: Array<{ email: string; password: string; role: string }>;
      error: null;
    }
  | { accounts: null; error: { message: string } }
> {
  try {
    const accounts = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const email = `demo_${type}_${timestamp}_${i + 1}@example.com`;
      const password = `Demo${type}${timestamp}${i + 1}`;
      const role = type === "merchant" ? "merchant" : "admin";
      
      // Create auth user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (userError) {
        console.error(`Error creating demo ${type} user:`, userError);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userData.user.id,
          first_name: `Demo`,
          last_name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
          email,
          role,
        },
      ]);

      if (profileError) {
        console.error(`Error creating demo ${type} profile:`, profileError);
        continue;
      }

      // If creating a merchant, also create a business
      if (type === "merchant") {
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .insert([
            {
              name: `Demo Business ${i + 1}`,
              owner_id: userData.user.id,
            },
          ])
          .select();

        if (businessError) {
          console.error("Error creating demo business:", businessError);
          continue;
        }

        // Update user profile with business ID
        if (businessData && businessData[0]) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ business_id: businessData[0].id })
            .eq("id", userData.user.id);

          if (updateError) {
            console.error("Error updating user with business ID:", updateError);
          }
        }
      }

      accounts.push({ email, password, role });
    }

    return { accounts, error: null };
  } catch (error) {
    console.error("Error creating demo accounts:", error);
    return {
      accounts: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

export async function createSpecificUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  businessName?: string;
}): Promise<{ email: string; password: string; role: string }> {
  try {
    const { email, password, firstName, lastName, role, businessName } = params;

    // Create auth user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) {
      console.error("Error creating specific user:", userError);
      throw userError;
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
      },
    ]);

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      throw profileError;
    }

    // If creating a merchant, also create a business
    if (role === "merchant" && businessName) {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert([
          {
            name: businessName,
            owner_id: userData.user.id,
          },
        ])
        .select();

      if (businessError) {
        console.error("Error creating business:", businessError);
        throw businessError;
      }

      // Update user profile with business ID
      if (businessData && businessData[0]) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ business_id: businessData[0].id })
          .eq("id", userData.user.id);

        if (updateError) {
          console.error("Error updating user with business ID:", updateError);
          throw updateError;
        }
      }
    }

    return { email, password, role };
  } catch (error) {
    console.error("Error in createSpecificUser:", error);
    throw error;
  }
}