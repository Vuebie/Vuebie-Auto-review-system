/**
 * @fileoverview Password Protection Library
 * 
 * This module provides functions to verify password strength and check for commonly leaked passwords.
 * It's implemented as a client-side solution while maintaining security best practices.
 * 
 * Limitations:
 * - This is a client-side implementation that doesn't replace server-side checks
 * - Ideally, a production system would use Supabase's built-in leaked password protection
 * - The local dictionary is limited compared to full database checks
 * 
 * Future improvements:
 * - Integrate with Supabase Auth Admin API when available
 * - Add API-based checks against HIBP (Have I Been Pwned) using k-anonymity
 * - Implement password strength scoring using zxcvbn or similar libraries
 */

// Export ES modules compatible with project settings
export const getSupabase = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const { createClient } = require("@supabase/supabase-js");
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Comprehensive password safety check that tests against:
 * 1. Common leaked passwords
 * 2. Length requirements
 * 3. Complexity requirements
 * 4. Sequential/repeated patterns
 * 
 * @param {string} password - The password to check
 * @returns {Promise<boolean>} - Returns true if password is safe
 * @throws {Error} - Throws an error with description if password fails checks
 */
export const isPasswordSafe = async (password) => {
  // Check for null, undefined or empty passwords
  if (!password || password.trim() === '') {
    throw new Error("Password cannot be empty");
  }
  
  // Check password length
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  
  // Very common leaked passwords (top entries from breach compilations)
  // This is a small subset - a real implementation would have thousands
  const leakedPasswords = [
    "password123", "qwerty123", "123456789", "abc123", "letmein",
    "welcome", "monkey", "password", "12345678", "dragon",
    "football", "baseball", "sunshine", "princess", "superman",
    "trustno1", "iloveyou", "welcome1", "admin123", "qwerty"
  ];
  
  // Check against leaked password list
  if (leakedPasswords.includes(password.toLowerCase())) {
    throw new Error("This password has appeared in data breaches. Please use a stronger password.");
  }
  
  // Check password complexity
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Create array of failed complexity requirements
  const failedChecks = [];
  if (!hasLowerCase) failedChecks.push("lowercase letters");
  if (!hasUpperCase) failedChecks.push("uppercase letters");
  if (!hasNumbers) failedChecks.push("numbers");
  if (!hasSpecialChars) failedChecks.push("special characters");
  
  // If 2 or more requirements are not met, reject the password
  if (failedChecks.length >= 2) {
    throw new Error(`Password is too weak. It should contain at least: ${failedChecks.join(", ")}`);
  }
  
  // Check for sequential characters (like "12345" or "abcde")
  const sequentialPatterns = [
    "12345", "23456", "34567", "45678", "56789",
    "abcde", "bcdef", "cdefg", "defgh", "efghi",
    "qwert", "werty", "ertyu", "rtyui", "tyuio"
  ];
  
  for (const pattern of sequentialPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      throw new Error("Password contains sequential characters. Please avoid patterns like '12345' or 'abcde'");
    }
  }
  
  // Check for repetitive characters (like "aaa" or "111")
  if (/(.)\1{2,}/.test(password)) {
    throw new Error("Password contains repetitive characters. Please avoid repeating characters like 'aaa' or '111'");
  }
  
  return true;
};

/**
 * Hook for integrating password protection into signup/registration flows
 * 
 * @param {Object} supabaseClient - Supabase client instance
 * @returns {Object} - Object with auth methods that wrap Supabase auth with password protection
 */
export const createProtectedAuth = (supabaseClient) => {
  return {
    /**
     * Protected signup method that checks password strength before registration
     * 
     * @param {Object} credentials - User credentials with email and password
     * @returns {Promise} - Supabase auth signup result after validation
     */
    signUp: async ({ email, password, ...options }) => {
      // Validate password before attempting signup
      await isPasswordSafe(password);
      
      // If validation passes, proceed with Supabase signup
      return supabaseClient.auth.signUp({
        email,
        password,
        ...options
      });
    },
    
    /**
     * Updates user password with validation
     * 
     * @param {string} newPassword - New password to set
     * @returns {Promise} - Result of password update operation
     */
    updatePassword: async (newPassword) => {
      // Validate new password
      await isPasswordSafe(newPassword);
      
      // If validation passes, proceed with password update
      return supabaseClient.auth.updateUser({
        password: newPassword
      });
    }
  };
};