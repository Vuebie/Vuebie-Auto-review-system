#!/bin/bash

# Script to apply the cron job scheduling SQL to Supabase

echo "Applying cron job scheduling to Supabase..."

# Get environment variables
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)

# If service role key is not in .env, prompt for it
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY not found in .env file."
  echo "Please enter the Supabase service role key:"
  read -s SUPABASE_SERVICE_ROLE_KEY
fi

# Apply the SQL migration using the Supabase REST API
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "query": "$(cat supabase/migrations/20250730_schedule_edge_functions.sql | sed 's/"/\\"/g' | tr -d '\n')"
}
EOF

echo -e "\n\nScheduling complete. Check the app_2d776e4976_scheduled_jobs view in Supabase to confirm."