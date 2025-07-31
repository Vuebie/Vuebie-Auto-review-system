// Test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '❌ Missing');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test basic connection
  const { data, error } = await supabase.from('profiles').select('count').limit(1);
  
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('✅ Supabase connection successful!');
    console.log('Test query result:', data);
  }
} catch (err) {
  console.error('❌ Connection test failed:', err.message);
  console.error('Full error:', err);
}