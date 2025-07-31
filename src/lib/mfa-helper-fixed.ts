import { supabase, TABLES } from './supabase-with-fallback';
import { securityMonitor } from './security-monitoring';
import { nanoid } from 'nanoid';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

/**
 * MFA Helper module for handling MFA operations
 */
export const mfaHelper = {
  /**
   * Generate a new TOTP secret for the user
   * @param userId The user ID to generate a secret for
   * @returns Object containing the secret and other setup information
   */
  async generateTOTPSecret(userId: string) {
    try {
      // Get user profile to include in TOTP label
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .select('business_name, contact_name, email')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw new Error(`Failed to retrieve user profile: ${profileError.message}`);
      }

      // Generate a secure random secret (base32 encoded)
      const secret = nanoid(20);
      
      // Create a new TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: 'Vuebie',
        label: profile?.email || userId,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      // Generate QR code URL
      const otpauth = totp.toString();
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      return {
        secret,
        qrCodeUrl,
        otpauth,
      };
    } catch (error) {
      securityMonitor.logSecurityEvent('MFA_SECRET_GENERATION_FAILED', {
        userId,
        error: error.message,
      }, 'HIGH');
      throw error;
    }
  },

  /**
   * Enroll user in MFA by saving the TOTP secret and generating recovery codes
   * @param userId The user ID to enroll
   * @param secret The TOTP secret
   * @returns Object containing recovery codes
   */
  async enrollMFA(userId: string, secret: string) {
    try {
      // Generate 10 recovery codes
      const recoveryCodes = Array.from({ length: 10 }, () => nanoid(10));
      
      // Hash the recovery codes for secure storage
      const hashedRecoveryCodes = await Promise.all(
        recoveryCodes.map(async (code) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(code);
          const hash = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        })
      );

      // Store the TOTP secret and recovery codes in the database
      const { error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .update({
          mfa_enabled: true,
          mfa_secret: secret, // In production, this should be encrypted
          mfa_recovery_codes: hashedRecoveryCodes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update MFA status: ${error.message}`);
      }

      // Log the MFA enrollment
      securityMonitor.logSecurityEvent('MFA_ENROLLED', {
        userId,
      }, 'MEDIUM');

      return {
        recoveryCodes
      };
    } catch (error) {
      securityMonitor.logSecurityEvent('MFA_ENROLLMENT_FAILED', {
        userId,
        error: error.message,
      }, 'HIGH');
      throw error;
    }
  },

  /**
   * Verify a TOTP code against a user's secret
   * @param userId The user ID
   * @param code The TOTP code to verify
   * @returns Boolean indicating if the code is valid
   */
  async verifyTOTPCode(userId: string, code: string) {
    try {
      // Get the user's TOTP secret
      const { data: profile, error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .select('mfa_secret')
        .eq('user_id', userId)
        .single();

      if (error || !profile?.mfa_secret) {
        throw new Error('Failed to retrieve MFA secret');
      }

      // Create a TOTP instance with the user's secret
      const totp = new OTPAuth.TOTP({
        issuer: 'Vuebie',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(profile.mfa_secret),
      });

      // Verify the code with a window of 3 to account for time drift (increased from 1)
      const delta = totp.validate({ token: code, window: 3 });
      
      // delta === null means invalid code
      // delta is a number that represents how many time steps the token is off by
      const isValid = delta !== null;

      if (isValid) {
        securityMonitor.logSecurityEvent('MFA_VERIFICATION_SUCCEEDED', {
          userId,
        }, 'LOW');
      } else {
        securityMonitor.logSecurityEvent('MFA_VERIFICATION_FAILED', {
          userId,
        }, 'MEDIUM');
      }

      return isValid;
    } catch (error) {
      securityMonitor.logSecurityEvent('MFA_VERIFICATION_ERROR', {
        userId,
        error: error.message,
      }, 'HIGH');
      throw error;
    }
  },

  /**
   * Verify a recovery code for a user
   * @param userId The user ID
   * @param recoveryCode The recovery code to verify
   * @returns Boolean indicating if the recovery code is valid
   */
  async verifyRecoveryCode(userId: string, recoveryCode: string) {
    try {
      // Get the user's recovery codes
      const { data: profile, error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .select('mfa_recovery_codes')
        .eq('user_id', userId)
        .single();

      if (error || !profile?.mfa_recovery_codes) {
        throw new Error('Failed to retrieve recovery codes');
      }

      // Hash the provided recovery code
      const encoder = new TextEncoder();
      const data = encoder.encode(recoveryCode);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashedCode = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Check if the hashed code exists in the user's recovery codes
      const isValid = profile.mfa_recovery_codes.includes(hashedCode);

      if (isValid) {
        // Remove the used recovery code
        const updatedCodes = profile.mfa_recovery_codes.filter(code => code !== hashedCode);
        
        // Update the user's recovery codes
        await supabase
          .from(TABLES.MERCHANT_PROFILES)
          .update({
            mfa_recovery_codes: updatedCodes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        securityMonitor.logSecurityEvent('MFA_RECOVERY_CODE_USED', {
          userId,
        }, 'MEDIUM');
      } else {
        securityMonitor.logSecurityEvent('MFA_RECOVERY_CODE_FAILED', {
          userId,
        }, 'MEDIUM');
      }

      return isValid;
    } catch (error) {
      securityMonitor.logSecurityEvent('MFA_RECOVERY_VERIFICATION_ERROR', {
        userId,
        error: error.message,
      }, 'HIGH');
      throw error;
    }
  },

  /**
   * Check if a user has MFA enabled
   * @param userId The user ID to check
   * @returns Boolean indicating if MFA is enabled
   */
  async isMFAEnabled(userId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .select('mfa_enabled')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data?.mfa_enabled || false;
    } catch (error) {
      console.error('Error checking MFA status:', error);
      return false;
    }
  },

  /**
   * Check if MFA is required for the user based on their role
   * @param userId The user ID to check
   * @returns Boolean indicating if MFA is required
   */
  async isMFARequired(userId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      // MFA is required for admin and super_admin roles
      return data?.role === 'admin' || data?.role === 'super_admin';
    } catch (error) {
      console.error('Error checking MFA requirement:', error);
      return false;
    }
  },

  /**
   * Disable MFA for a user
   * @param userId The user ID
   * @returns Boolean indicating success
   */
  async disableMFA(userId: string) {
    try {
      const { error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          mfa_recovery_codes: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      securityMonitor.logSecurityEvent('MFA_DISABLED', {
        userId,
      }, 'MEDIUM');

      return true;
    } catch (error) {
      securityMonitor.logSecurityEvent('MFA_DISABLE_FAILED', {
        userId,
        error: error.message,
      }, 'HIGH');
      throw error;
    }
  },
  
  /**
   * Generate new recovery codes for a user
   * @param userId The user ID
   * @returns Object containing new recovery codes
   */
  async regenerateRecoveryCodes(userId: string) {
    try {
      // Generate 10 new recovery codes
      const recoveryCodes = Array.from({ length: 10 }, () => nanoid(10));
      
      // Hash the recovery codes for secure storage
      const hashedRecoveryCodes = await Promise.all(
        recoveryCodes.map(async (code) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(code);
          const hash = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        })
      );

      // Update the recovery codes in the database
      const { error } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .update({
          mfa_recovery_codes: hashedRecoveryCodes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update recovery codes: ${error.message}`);
      }

      securityMonitor.logSecurityEvent('MFA_RECOVERY_CODES_REGENERATED', {
        userId,
      }, 'MEDIUM');

      return {
        recoveryCodes
      };
    } catch (error) {
      securityMonitor.logSecurityEvent('MFA_RECOVERY_CODES_REGENERATION_FAILED', {
        userId,
        error: error.message,
      }, 'HIGH');
      throw error;
    }
  }
};