import { supabase } from './supabase-client';
import { securityMonitor } from './security-monitoring';
import { enhancedErrorMonitor } from './enhanced-error-monitoring';
import { TABLES } from './supabase-client-enhanced';
import { User, Session } from '@supabase/supabase-js';

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
  session?: Session;
}

export interface ResetResult {
  success: boolean;
  error: AuthError | null;
}

export interface UpdateResult {
  success: boolean;
  error: AuthError | null;
}

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ValidationResult {
  valid: boolean;
  error: AuthError | null;
}

export interface RateLimitParams {
  identifier: string;
  action: string;
  maxAttempts: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  limited: boolean;
  remainingAttempts: number;
  resetTime: string;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string;
  role: string;
  mfa_enabled: boolean;
  last_login_at: string;
  failed_login_attempts: number;
  created_at: string;
}

/**
 * Secure sign-in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string,
  clientIp: string = 'unknown'
): Promise<AuthResult> {
  try {
    // Check password strength before submission
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return {
        user: null,
        error: {
          message: "Password does not meet security requirements: " + passwordErrors.join(", "),
          status: 400
        }
      };
    }

    // Implement rate limiting
    const { limited, remainingAttempts } = await checkRateLimit({
      identifier: `${email}|${clientIp}`,
      action: 'login_attempt',
      maxAttempts: 5,
      windowSeconds: 300
    });

    if (limited) {
      securityMonitor.logSecurityEvent('LOGIN_RATE_LIMITED', {
        email,
        ipAddress: clientIp,
        remainingAttempts
      }, 'MEDIUM');

      return {
        user: null,
        error: {
          message: `Too many login attempts. Please try again after 5 minutes.`,
          status: 429
        }
      };
    }

    // Proceed with authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication failure
    if (error) {
      securityMonitor.logSecurityEvent('LOGIN_FAILED', {
        email,
        ipAddress: clientIp,
        errorMessage: error.message
      }, 'MEDIUM');
      
      // Record this attempt in rate limits
      await recordFailedAttempt(email, clientIp);
      
      return { user: null, error: { message: error.message, status: error.status } };
    }

    // Get user profile with role information
    try {
      const userProfile = await getMerchantProfile(data.user.id);
      
      // Check for suspicious login patterns
      const { suspicious, reason } = await securityMonitor.checkLoginPatterns(data.user.id, email);
      
      if (suspicious) {
        securityMonitor.logSecurityEvent('SUSPICIOUS_LOGIN', {
          userId: data.user.id,
          email,
          reason,
          ipAddress: clientIp
        }, 'HIGH');
        
        // For high-risk accounts, we might want to force MFA or additional verification
        if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
          // Implement additional verification if needed
        }
      }
      
      // Record login history
      await recordLoginHistory(data.user.id, clientIp, true);
      
      // Reset failed login attempts
      if (userProfile) {
        await supabase
          .from(TABLES.MERCHANT_PROFILES)
          .update({ 
            failed_login_attempts: 0,
            last_login_at: new Date().toISOString()
          })
          .eq('user_id', data.user.id);
      }
      
      // Log successful login
      securityMonitor.logSecurityEvent('LOGIN_SUCCESSFUL', {
        userId: data.user.id,
        email,
        role: userProfile?.role || 'unknown',
        ipAddress: clientIp
      }, 'LOW');

      return { user: data.user, session: data.session, error: null };
    } catch (profileError) {
      // Handle profile fetch error securely
      securityMonitor.logSecurityEvent('PROFILE_FETCH_ERROR', {
        userId: data.user.id,
        email,
        error: profileError instanceof Error ? profileError.message : String(profileError)
      }, 'MEDIUM');
      
      // Return authenticated user but with warning
      return {
        user: data.user,
        session: data.session,
        error: {
          message: "Authenticated, but unable to fetch user profile. Limited access available.",
          status: 206 // Partial Content
        }
      };
    }
  } catch (error) {
    // Log unexpected errors
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Unknown authentication error'),
      { email, action: 'signInWithEmail' }
    );
    
    return {
      user: null,
      error: {
        message: "Authentication failed due to a system error. Please try again.",
        status: 500
      }
    };
  }
}

/**
 * Secure sign-up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: UserMetadata = {}
): Promise<AuthResult> {
  try {
    // Validate password strength
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return {
        user: null,
        error: {
          message: "Password does not meet security requirements: " + passwordErrors.join(", "),
          status: 400
        }
      };
    }

    // Check rate limit for signup from this IP
    const clientIp = 'unknown'; // In a real implementation, this should come from the request
    const { limited } = await checkRateLimit({
      identifier: clientIp,
      action: 'signup_attempt',
      maxAttempts: 3,
      windowSeconds: 3600
    });

    if (limited) {
      securityMonitor.logSecurityEvent('SIGNUP_RATE_LIMITED', {
        email,
        ipAddress: clientIp
      }, 'MEDIUM');

      return {
        user: null,
        error: {
          message: "Too many signup attempts. Please try again later.",
          status: 429
        }
      };
    }

    // Proceed with registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: metadata.firstName || '',
          lastName: metadata.lastName || '',
          role: metadata.role || 'merchant'
        }
      }
    });

    if (error) {
      securityMonitor.logSecurityEvent('SIGNUP_FAILED', {
        email,
        ipAddress: clientIp,
        errorMessage: error.message
      }, 'MEDIUM');
      
      return { user: null, error: { message: error.message, status: error.status } };
    }

    // Create merchant profile
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from(TABLES.MERCHANT_PROFILES)
          .insert({
            user_id: data.user.id,
            business_name: metadata.businessName || '',
            contact_name: `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim(),
            mfa_enabled: false,
            failed_login_attempts: 0
          });

        if (profileError) {
          securityMonitor.logSecurityEvent('PROFILE_CREATION_FAILED', {
            userId: data.user.id,
            email,
            errorMessage: profileError.message
          }, 'HIGH');
        } else {
          securityMonitor.logSecurityEvent('PROFILE_CREATED', {
            userId: data.user.id,
            email,
            businessName: metadata.businessName
          }, 'LOW');
        }
      } catch (profileError) {
        enhancedErrorMonitor.logError(
          profileError instanceof Error ? profileError : new Error('Unknown profile creation error'),
          { userId: data.user.id, email, action: 'createMerchantProfile' }
        );
      }
    }

    securityMonitor.logSecurityEvent('SIGNUP_SUCCESSFUL', {
      userId: data.user?.id,
      email
    }, 'LOW');

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Unknown registration error'),
      { email, action: 'signUpWithEmail' }
    );
    
    return {
      user: null,
      error: {
        message: "Registration failed due to a system error. Please try again.",
        status: 500
      }
    };
  }
}

/**
 * Secure sign out with session tracking
 */
export async function signOut(): Promise<void> {
  try {
    // Get current user before signing out
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      securityMonitor.logSecurityEvent('SIGNOUT_FAILED', {
        userId,
        errorMessage: error.message
      }, 'MEDIUM');
      throw error;
    }

    if (userId) {
      securityMonitor.logSecurityEvent('USER_SIGNED_OUT', {
        userId
      }, 'LOW');
    }
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Unknown sign out error'),
      { action: 'signOut' }
    );
  }
}

/**
 * Secure password reset request
 */
export async function resetPassword(email: string): Promise<ResetResult> {
  try {
    // Check rate limit
    const clientIp = 'unknown'; // In real implementation, get from request
    const { limited } = await checkRateLimit({
      identifier: `${email}|${clientIp}`,
      action: 'reset_password',
      maxAttempts: 3,
      windowSeconds: 3600
    });

    if (limited) {
      securityMonitor.logSecurityEvent('PASSWORD_RESET_RATE_LIMITED', {
        email,
        ipAddress: clientIp
      }, 'MEDIUM');

      return {
        success: false,
        error: {
          message: "Too many password reset requests. Please try again later.",
          status: 429
        }
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      securityMonitor.logSecurityEvent('PASSWORD_RESET_FAILED', {
        email,
        ipAddress: clientIp,
        errorMessage: error.message
      }, 'MEDIUM');
      
      return { success: false, error: { message: error.message, status: error.status } };
    }

    securityMonitor.logSecurityEvent('PASSWORD_RESET_REQUESTED', {
      email,
      ipAddress: clientIp
    }, 'MEDIUM');

    return { success: true, error: null };
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Unknown password reset error'),
      { email, action: 'resetPassword' }
    );
    
    return {
      success: false,
      error: {
        message: "Password reset request failed. Please try again.",
        status: 500
      }
    };
  }
}

/**
 * Secure password update with strength validation
 */
export async function updatePassword(password: string): Promise<UpdateResult> {
  try {
    // Validate password strength
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return {
        success: false,
        error: {
          message: "Password does not meet security requirements: " + passwordErrors.join(", "),
          status: 400
        }
      };
    }

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return {
        success: false,
        error: { message: "No authenticated user found.", status: 401 }
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      securityMonitor.logSecurityEvent('PASSWORD_UPDATE_FAILED', {
        userId: userData.user.id,
        errorMessage: error.message
      }, 'HIGH');
      
      return { success: false, error: { message: error.message, status: error.status } };
    }

    securityMonitor.logSecurityEvent('PASSWORD_UPDATED', {
      userId: userData.user.id
    }, 'MEDIUM');

    return { success: true, error: null };
  } catch (error) {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Unknown password update error'),
      { userId, action: 'updatePassword' }
    );
    
    return {
      success: false,
      error: {
        message: "Password update failed. Please try again.",
        status: 500
      }
    };
  }
}

/**
 * Get current user with secure token validation
 */
export async function getCurrentUser() {
  try {
    // Validate the token first
    const { valid, error } = await validateToken();
    if (!valid) {
      return { user: null, error: error || { message: "Invalid session" } };
    }
    
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) {
      return { user: null, error: { message: "User not found" } };
    }
    
    return { user: data.user, error: null };
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Error getting current user'),
      { action: 'getCurrentUser' }
    );
    
    return {
      user: null,
      error: {
        message: "Failed to retrieve user information",
        status: 500
      }
    };
  }
}

/**
 * Get merchant profile with secure error handling
 */
export async function getMerchantProfile(userId: string): Promise<MerchantProfile | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.MERCHANT_PROFILES)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      securityMonitor.logSecurityEvent('PROFILE_FETCH_FAILED', {
        userId,
        errorMessage: error?.message || 'No profile found'
      }, 'MEDIUM');
      return null;
    }

    return data as MerchantProfile;
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Unknown profile fetch error'),
      { userId, action: 'getMerchantProfile' }
    );
    return null;
  }
}

/**
 * Token validation function
 */
export async function validateToken(): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      // Try to refresh the token if possible
      const refreshResult = await supabase.auth.refreshSession();
      
      if (refreshResult.error) {
        return { valid: false, error: { message: refreshResult.error.message, status: refreshResult.error.status } };
      }
      
      return { valid: true, error: null };
    }
    
    if (!data.session) {
      return { valid: false, error: { message: "No active session" } };
    }
    
    // Check token expiration
    const expiresAt = data.session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      return { valid: false, error: { message: "Session expired" } };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Token validation error'),
      { action: 'validateToken' }
    );
    
    return {
      valid: false,
      error: {
        message: error instanceof Error ? error.message : "Token validation failed",
        status: 500
      }
    };
  }
}

/**
 * Secure rate limiting implementation
 */
async function checkRateLimit(params: RateLimitParams): Promise<RateLimitResult> {
  const { identifier, action, maxAttempts, windowSeconds } = params;
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  
  try {
    // Count recent attempts
    const { data: attempts, error } = await supabase
      .from(TABLES.RATE_LIMITS)
      .select('created_at')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStart);
    
    if (error) {
      throw error;
    }
    
    const attemptCount = attempts?.length || 0;
    const limited = attemptCount >= maxAttempts;
    const remainingAttempts = Math.max(0, maxAttempts - attemptCount);
    
    // Record this attempt
    if (!limited) {
      await supabase
        .from(TABLES.RATE_LIMITS)
        .insert({
          identifier,
          action,
          created_at: new Date().toISOString()
        });
    }
    
    // Calculate reset time
    let resetTime = new Date().toISOString();
    if (attempts && attempts.length > 0) {
      const oldestAttempt = new Date(attempts[0].created_at);
      resetTime = new Date(oldestAttempt.getTime() + windowSeconds * 1000).toISOString();
    }
    
    return { limited, remainingAttempts, resetTime };
  } catch (error) {
    // Log rate limiting error
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Rate limiting error'),
      { identifier, action }
    );
    
    // Fail open - allow the request if rate limiting check fails
    return { limited: false, remainingAttempts: 1, resetTime: new Date().toISOString() };
  }
}

/**
 * Record failed login attempt
 */
async function recordFailedAttempt(email: string, clientIp: string): Promise<void> {
  try {
    // Find user by email to update failed attempts counter
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userData?.id) {
      // Increment failed login attempts
      const { data: profileData } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .select('failed_login_attempts')
        .eq('user_id', userData.id)
        .single();

      const currentAttempts = (profileData?.failed_login_attempts || 0) + 1;
      
      await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .update({ failed_login_attempts: currentAttempts })
        .eq('user_id', userData.id);
        
      // Record login history
      await recordLoginHistory(userData.id, clientIp, false);
    }
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Error recording failed attempt'),
      { email, action: 'recordFailedAttempt' }
    );
  }
}

/**
 * Record login history
 */
async function recordLoginHistory(userId: string, ipAddress: string, success: boolean): Promise<void> {
  try {
    await supabase
      .from(TABLES.LOGIN_HISTORY)
      .insert({
        user_id: userId,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        location: '', // Could be populated with geolocation data
        success
      });
  } catch (error) {
    enhancedErrorMonitor.logError(
      error instanceof Error ? error : new Error('Error recording login history'),
      { userId, action: 'recordLoginHistory' }
    );
  }
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): string[] {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
}