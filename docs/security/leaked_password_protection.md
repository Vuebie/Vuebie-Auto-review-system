# Enabling Leaked Password Protection in Supabase Auth

## Overview
This document outlines how we've implemented leaked password protection in our Supabase Auth configuration. This security feature checks user passwords against the HaveIBeenPwned (HIBP) database to prevent the use of compromised passwords.

## Implementation Details

### Method 1: Supabase Dashboard Configuration (Recommended)
The primary and recommended method to enable leaked password protection:

1. **Access the Supabase Dashboard**
   - Log in to [Supabase Dashboard](https://app.supabase.com)
   - Select the Vuebie project

2. **Navigate to Authentication Settings**
   - In the left sidebar, click on "Authentication"
   - Select the "Policies" tab

3. **Enable Password Security Features**
   - Find the "Password Security" section
   - Toggle ON the option "Prevent use of leaked passwords" 
   - Save changes

### Method 2: Using Edge Functions (Alternative)
We've also created an Edge Function that can enable this feature programmatically:

1. **Deploy the Edge Function**
   - The function is located at `/supabase/functions/enable_leaked_password_protection`
   - Deploy using `supabase functions deploy enable_leaked_password_protection`

2. **Run the Configuration Script**
   - Execute `/scripts/enable_leaked_password_protection.js`
   - This will invoke the edge function with proper authentication

## Verification Process

After enabling the feature, verify its effectiveness:

1. **Manual Testing**
   - Create a new test account with a known compromised password (e.g., "password123")
   - The system should reject the password with a security warning

2. **Automated Testing**
   - Use the verification script in `/scripts/test_leaked_password_protection.js`
   - This script attempts registrations with known compromised passwords

## Important Notes

1. **Plan Requirement**
   - This feature is available only on Supabase Pro plan and above
   - Free tier users will not have access to this protection

2. **Related Security Measures**
   - We've also implemented minimum password length (8 characters)
   - Password complexity requirements are enabled (lowercase, uppercase, digits)

3. **Edge Cases**
   - The HIBP API is called using a k-anonymity model, preserving user privacy
   - False positives are extremely rare but possible
   - API failures will default to allowing the password (fail-open)

## Monitoring and Maintenance

- Regularly check Supabase logs for authentication failures
- Monitor for unusual patterns in failed registration attempts
- This protection is automatically updated as new password breaches are added to HIBP

## References
- [Supabase Documentation on Password Security](https://supabase.com/docs/guides/auth/password-security)
- [HaveIBeenPwned API Documentation](https://haveibeenpwned.com/API/v3)