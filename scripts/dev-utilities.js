// Development Utilities - Demo Account Creation
// This file is only for development/testing purposes and should NOT be included in production builds

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createDemoAccounts(type = "merchant", count = 1) {
  console.log(`Creating ${count} demo ${type} account(s)...`);
  
  try {
    const accounts = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const email = `demo_${type}_${timestamp}_${i + 1}@example.com`;
      const password = `Demo${type}${timestamp}${i + 1}`;
      const role = type === "merchant" ? "merchant" : "admin";
      
      // Create auth user using service role
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (userError) {
        console.error(`Error creating demo ${type} user:`, userError);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userData.user.id,
          first_name: `Demo`,
          last_name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
          email,
          role,
        },
      ]);

      if (profileError) {
        console.error(`Error creating demo ${type} profile:`, profileError);
        continue;
      }

      // If creating a merchant, also create a business
      if (type === "merchant") {
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .insert([
            {
              name: `Demo Business ${i + 1}`,
              owner_id: userData.user.id,
            },
          ])
          .select();

        if (businessError) {
          console.error("Error creating demo business:", businessError);
          continue;
        }

        // Update user profile with business ID
        if (businessData && businessData[0]) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ business_id: businessData[0].id })
            .eq("id", userData.user.id);

          if (updateError) {
            console.error("Error updating user with business ID:", updateError);
          }
        }
      }

      accounts.push({ email, password, role });
      console.log(`✅ Created demo ${type}: ${email}`);
    }

    console.log(`\n🎉 Successfully created ${accounts.length} demo account(s)`);
    return accounts;
  } catch (error) {
    console.error("Error in createDemoAccounts:", error);
    throw error;
  }
}

export async function createSpecificUser(params) {
  const { email, password, firstName, lastName, role, businessName } = params;
  console.log(`Creating specific user: ${email} with role: ${role}`);

  try {
    // Create auth user using service role
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) {
      console.error("Error creating specific user:", userError);
      throw userError;
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
      },
    ]);

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      throw profileError;
    }

    // If creating a merchant, also create a business
    if (role === "merchant" && businessName) {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert([
          {
            name: businessName,
            owner_id: userData.user.id,
          },
        ])
        .select();

      if (businessError) {
        console.error("Error creating business:", businessError);
        throw businessError;
      }

      // Update user profile with business ID
      if (businessData && businessData[0]) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ business_id: businessData[0].id })
          .eq("id", userData.user.id);

        if (updateError) {
          console.error("Error updating user with business ID:", updateError);
          throw updateError;
        }
      }
    }

    console.log(`✅ Created user: ${email}`);
    return { email, password, role };
  } catch (error) {
    console.error("Error in createSpecificUser:", error);
    throw error;
  }
}

// CLI interface
if (process.argv[1] && process.argv[1].includes('dev-utilities.js')) {
  const command = process.argv[2];
  
  if (command === 'create-demo') {
    const type = process.argv[3] || 'merchant';
    const count = parseInt(process.argv[4]) || 1;
    
    createDemoAccounts(type, count)
      .then(accounts => {
        console.log('\n📋 Account Summary:');
        accounts.forEach(account => {
          console.log(`${account.role}: ${account.email} / ${account.password}`);
        });
      })
      .catch(error => {
        console.error('Failed to create demo accounts:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node scripts/dev-utilities.js create-demo [merchant|admin] [count]');
    console.log('Example: node scripts/dev-utilities.js create-demo merchant 3');
  }
}