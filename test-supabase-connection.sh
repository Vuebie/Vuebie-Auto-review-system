#!/bin/bash
# Script to test Supabase connection with current environment variables

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Supabase Connection Test =====${NC}"
echo "Checking environment variables..."

# Check if environment variables are set
if [ -f .env ]; then
  echo -e "${GREEN}✓ .env file found${NC}"
  # Extract and sanitize values for display (only showing first few characters)
  SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
  SUPABASE_KEY=$(grep SUPABASE_KEY .env | cut -d '=' -f2)
  
  if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
    echo -e "${GREEN}✓ SUPABASE_URL is set${NC}"
    echo -e "${GREEN}✓ SUPABASE_KEY is set${NC}"
    
    # Show partial values for verification
    URL_PREVIEW="${SUPABASE_URL:0:25}..."
    KEY_PREVIEW="${SUPABASE_KEY:0:15}..."
    echo -e "URL: ${YELLOW}$URL_PREVIEW${NC}"
    echo -e "KEY: ${YELLOW}$KEY_PREVIEW${NC}"
  else
    echo -e "${RED}✗ Missing required Supabase environment variables${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ .env file not found${NC}"
  exit 1
fi

echo -e "\nTesting connection to Supabase..."
echo "Creating temporary test file..."

# Create temporary file
cat > test-connection.js << EOL
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Testing connection with:');
console.log('URL: ' + supabaseUrl?.substring(0, 25) + '...');
console.log('KEY: ' + supabaseKey?.substring(0, 15) + '...');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Attempting connection...');
    const { data, error } = await supabase.from('app_92a6ca4590_merchant_profiles').select('count(*)');
    
    if (error) {
      console.error('Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('Connection successful!');
    console.log('Data:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
EOL

echo -e "\nInstalling dependencies if needed..."
npm install -q @supabase/supabase-js dotenv

echo -e "\nRunning connection test..."
node -r esm test-connection.js

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✓ Supabase connection test PASSED${NC}"
  echo -e "The application is correctly configured to connect to Supabase"
else
  echo -e "\n${RED}✗ Supabase connection test FAILED${NC}"
  echo -e "Please check your environment variables and network connectivity"
fi

echo -e "\nCleaning up..."
rm test-connection.js

echo -e "\n${BLUE}===== Test Complete =====${NC}"