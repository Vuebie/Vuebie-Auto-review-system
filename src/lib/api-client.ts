import { supabase } from './supabase-client';

export async function sendVerificationEmail(email: string) {
  try {
    const response = await fetch(
      `https://puldndhrobcaeogmjfij.functions.supabase.co/app_92a6ca4590_send_verification_email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(({ data }) => data?.session?.access_token)}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send verification email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function verifyUser(userId: string) {
  try {
    // Call the admin API to verify the user
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error verifying user:', error);
    throw error;
  }
}