// Test script to verify leaked password protection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Test with known leaked passwords
const LEAKED_PASSWORDS = [
  'password123',
  'qwerty123',
  '123456789',
  'abc123',
  'letmein'
];

// Test with strong passwords (should pass)
const STRONG_PASSWORDS = [
  'aC3%9pK!xZ@2sR7',
  'T5*bQ8$rD#wE3&n',
  'P4^mV7(hJ2)kL9+'
];

async function testLeakedPasswordProtection() {
  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials. Check .env file.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Starting leaked password protection verification test...');
    console.log('===================================================');

    console.log('1. Testing known leaked passwords (should be rejected):');
    for (const password of LEAKED_PASSWORDS) {
      const email = `test_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('weak password') || 
            error.message.includes('leaked') || 
            error.message.includes('compromised')) {
          console.log(`✅ Password "${password}" correctly rejected: ${error.message}`);
        } else {
          console.log(`❓ Password "${password}" rejected for other reason: ${error.message}`);
        }
      } else {
        console.log(`❌ Password "${password}" was accepted but should be rejected!`);
        
        // Clean up by deleting the user
        if (data?.user?.id) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
      }
    }

    console.log('\n2. Testing strong passwords (should be accepted):');
    for (const password of STRONG_PASSWORDS) {
      const email = `test_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.log(`❌ Strong password rejected: ${error.message}`);
      } else {
        console.log(`✅ Strong password correctly accepted`);
        
        // Clean up by deleting the user
        if (data?.user?.id) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
      }
    }

    console.log('\nVerification test completed.');
    console.log('If leaked passwords were rejected and strong passwords accepted, the feature is working correctly.');
  } catch (error) {
    console.error('Error during verification test:', error);
  }
}

testLeakedPasswordProtection();