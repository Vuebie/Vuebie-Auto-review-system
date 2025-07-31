// Authentication Debug Test Script
// Run this in browser console to test mock authentication

console.log('🧪 [TEST] Starting authentication debug test...');

// Test 1: Check if mock auth is enabled
console.log('\n=== TEST 1: Mock Auth Configuration ===');
try {
  // This will trigger the shouldUseMockAuth function
  const mockAuthModule = await import('./src/lib/mock-auth.ts');
  const shouldUseMock = mockAuthModule.shouldUseMockAuth();
  console.log('✅ Mock auth enabled:', shouldUseMock);
} catch (error) {
  console.error('❌ Failed to check mock auth:', error);
}

// Test 2: Check supabase client initialization
console.log('\n=== TEST 2: Supabase Client ===');
try {
  const supabaseModule = await import('./src/lib/supabase-with-fallback.ts');
  console.log('✅ Supabase module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load supabase module:', error);
}

// Test 3: Test mock authentication directly
console.log('\n=== TEST 3: Direct Mock Auth Test ===');
try {
  const { supabase } = await import('./src/lib/supabase-with-fallback.ts');
  
  // Test with Super Admin credentials
  console.log('Testing Super Admin login...');
  const result = await supabase.auth.signInWithPassword({
    email: 'superadmin@vuebie.com',
    password: '123456'
  });
  
  console.log('Auth result:', {
    hasUser: !!result.data?.user,
    hasSession: !!result.data?.session,
    error: result.error?.message,
    userEmail: result.data?.user?.email,
    userRole: result.data?.user?.user_metadata?.role
  });
  
  if (result.data?.user) {
    console.log('✅ Mock authentication working!');
  } else {
    console.log('❌ Mock authentication failed:', result.error);
  }
} catch (error) {
  console.error('❌ Direct auth test failed:', error);
}

console.log('\n🧪 [TEST] Authentication debug test completed.');
console.log('\n📋 Available test accounts:');
console.log('- superadmin@vuebie.com / 123456 (Super Admin)');
console.log('- admin@vuebie.com / 123456 (Admin)');
console.log('- merchant@vuebie.com / 123456 (Merchant)');