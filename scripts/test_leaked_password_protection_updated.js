// Updated test script for leaked password protection
// Uses ES Modules syntax as required by the project
import dotenv from 'dotenv';
import { isPasswordSafe } from '../src/lib/password-protection.js';

dotenv.config();

// ANSI color codes for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/**
 * Comprehensive test for password protection implementation
 * Tests various password scenarios to ensure proper validation
 */
async function testLeakedPasswordProtection() {
  console.log(`${BOLD}Comprehensive Leaked Password Protection Test${RESET}`);
  console.log('====================================================');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test known leaked passwords (should all be rejected)
  console.log(`\n${BOLD}1. Testing Known Leaked Passwords:${RESET}`);
  const leakedPasswords = [
    'password123', 
    'qwerty123', 
    '123456789', 
    'abc123', 
    'letmein',
    'welcome',
    'admin123',
    'password'
  ];
  
  for (const password of leakedPasswords) {
    totalTests++;
    try {
      await isPasswordSafe(password);
      console.log(`${RED}❌ FAIL: Password "${password}" was accepted but should be rejected!${RESET}`);
    } catch (error) {
      console.log(`${GREEN}✅ PASS: Password "${password}" was correctly rejected: ${error.message}${RESET}`);
      passedTests++;
    }
  }
  
  // Test length requirements
  console.log(`\n${BOLD}2. Testing Length Requirements:${RESET}`);
  const shortPasswords = ['', '123', 'pass', 'short'];
  
  for (const password of shortPasswords) {
    totalTests++;
    try {
      await isPasswordSafe(password);
      console.log(`${RED}❌ FAIL: Short password "${password}" was accepted!${RESET}`);
    } catch (error) {
      console.log(`${GREEN}✅ PASS: Short password correctly rejected: ${error.message}${RESET}`);
      passedTests++;
    }
  }
  
  // Test complexity requirements
  console.log(`\n${BOLD}3. Testing Complexity Requirements:${RESET}`);
  const weakPasswords = [
    { password: 'onlylowercase', shouldReject: true },
    { password: 'ONLYUPPERCASE', shouldReject: true },
    { password: '12345678', shouldReject: true }, 
    { password: '!@#$%^&*()', shouldReject: true },
    { password: 'nodigits!', shouldReject: true },
    { password: 'NoSpecial1', shouldReject: false }
  ];
  
  for (const { password, shouldReject } of weakPasswords) {
    totalTests++;
    try {
      await isPasswordSafe(password);
      if (shouldReject) {
        console.log(`${RED}❌ FAIL: Weak password "${password}" was accepted but should be rejected!${RESET}`);
      } else {
        console.log(`${GREEN}✅ PASS: Password "${password}" correctly accepted (meets minimum requirements)${RESET}`);
        passedTests++;
      }
    } catch (error) {
      if (shouldReject) {
        console.log(`${GREEN}✅ PASS: Weak password "${password}" correctly rejected: ${error.message}${RESET}`);
        passedTests++;
      } else {
        console.log(`${RED}❌ FAIL: Password "${password}" was rejected but should be accepted: ${error.message}${RESET}`);
      }
    }
  }
  
  // Test pattern checks
  console.log(`\n${BOLD}4. Testing Sequential/Repetitive Pattern Detection:${RESET}`);
  const patternPasswords = [
    'abc12345def', 
    'password12345', 
    'qwertyuiop!1', 
    'aaaPassword1!',
    '111Password!'
  ];
  
  for (const password of patternPasswords) {
    totalTests++;
    try {
      await isPasswordSafe(password);
      console.log(`${RED}❌ FAIL: Password with pattern "${password}" was accepted but should be rejected!${RESET}`);
    } catch (error) {
      console.log(`${GREEN}✅ PASS: Password with pattern correctly detected: ${error.message}${RESET}`);
      passedTests++;
    }
  }
  
  // Test strong passwords (should all be accepted)
  console.log(`\n${BOLD}5. Testing Strong Passwords:${RESET}`);
  const strongPasswords = [
    'U2K$9p@Ax7!zQnR',
    'V3ryStr0ng&P@ssw0rd!',
    'C0mpl3x_P@$$w0rd-2023',
    'n0-R3p3@t1ng-Ch@rs!',
    'Un1qu3&C0mplex!'
  ];
  
  for (const password of strongPasswords) {
    totalTests++;
    try {
      await isPasswordSafe(password);
      console.log(`${GREEN}✅ PASS: Strong password "${password}" correctly accepted${RESET}`);
      passedTests++;
    } catch (error) {
      console.log(`${RED}❌ FAIL: Strong password rejected: ${error.message}${RESET}`);
    }
  }
  
  // Test edge cases
  console.log(`\n${BOLD}6. Testing Edge Cases:${RESET}`);
  const edgeCases = [
    { value: null, name: 'null' },
    { value: undefined, name: 'undefined' },
    { value: '   ', name: 'whitespace only' },
    { value: 'password\u0000hidden', name: 'null byte injection' },
    { value: 'a'.repeat(100), name: 'very long (100 chars)' }
  ];
  
  for (const { value, name } of edgeCases) {
    totalTests++;
    try {
      await isPasswordSafe(value);
      console.log(`${RED}❌ FAIL: Edge case "${name}" was accepted!${RESET}`);
    } catch (error) {
      console.log(`${GREEN}✅ PASS: Edge case "${name}" correctly handled: ${error.message}${RESET}`);
      passedTests++;
    }
  }
  
  // Report overall results
  console.log(`\n${BOLD}=====================================================${RESET}`);
  console.log(`${BOLD}Test Summary:${RESET}`);
  console.log(`Total tests run: ${totalTests}`);
  console.log(`Tests passed: ${passedTests}`);
  console.log(`Success rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n${GREEN}${BOLD}ALL TESTS PASSED! The password protection implementation is working correctly.${RESET}`);
  } else {
    console.log(`\n${YELLOW}${BOLD}SOME TESTS FAILED. Review the implementation based on test results.${RESET}`);
  }
}

// Run the tests
testLeakedPasswordProtection();