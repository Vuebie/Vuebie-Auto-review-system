// This script creates test accounts for the Vuebie platform
import { createSpecificUser } from '../src/lib/auth';

const TEST_ACCOUNTS = [
  {
    email: 'test.merchant@vuebie.com',
    password: 'TestMerchant123!',
    firstName: 'Test',
    lastName: 'Merchant',
    role: 'merchant',
    businessName: 'Test Business'
  },
  {
    email: 'test.admin@vuebie.com',
    password: 'TestAdmin123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin'
  },
  {
    email: 'test.superadmin@vuebie.com',
    password: 'TestSuperAdmin123!',
    firstName: 'Test',
    lastName: 'SuperAdmin',
    role: 'super_admin'
  },
  {
    email: 'test.customer@vuebie.com',
    password: 'TestCustomer123!',
    firstName: 'Test',
    lastName: 'Customer',
    role: 'customer'
  }
];

async function createTestAccounts() {
  console.log('Creating test accounts...');
  const results = [];

  for (const account of TEST_ACCOUNTS) {
    try {
      console.log(`Creating account for ${account.email}...`);
      const result = await createSpecificUser(account);
      results.push({ ...result, status: 'success' });
      console.log(`Account created: ${account.email}`);
    } catch (error) {
      console.error(`Failed to create account for ${account.email}:`, error.message);
      results.push({ 
        email: account.email, 
        role: account.role, 
        status: 'error',
        error: error.message
      });
    }
  }

  console.log('\nTest Account Creation Summary:');
  console.table(results);
  
  console.log('\nValid Test Accounts:');
  const validAccounts = results.filter(r => r.status === 'success');
  console.table(validAccounts.map(({ email, password, role }) => ({ email, password, role })));
}

createTestAccounts().catch(console.error);