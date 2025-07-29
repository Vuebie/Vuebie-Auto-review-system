// Script to enable leaked password protection via Edge Function
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function enableLeakedPasswordProtection() {
  try {
    console.log('Enabling leaked password protection via Supabase Edge Function...');
    
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials. Check .env file.');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/enable_leaked_password_protection`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          enable: true
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Error: ${data.error || response.statusText}`);
    }

    console.log('SUCCESS! Leaked password protection has been enabled.');
    console.log(`Function ID: ${data.function_id}`);
    console.log(`Status: ${data.status}`);
    console.log('');
    console.log('IMPORTANT: This script has configured the Supabase project.');
    console.log('To verify this works, attempt to create a user with a common leaked password.');
    
  } catch (error) {
    console.error('Error enabling leaked password protection:');
    console.error(error);
    console.log('');
    console.log('MANUAL ALTERNATIVE:');
    console.log('1. Go to the Supabase Dashboard');
    console.log('2. Navigate to Authentication > Policies');
    console.log('3. Enable "Prevent users from using passwords exposed in data breaches"');
  }
}

enableLeakedPasswordProtection();