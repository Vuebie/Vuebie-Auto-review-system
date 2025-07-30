#!/usr/bin/env node

/**
 * Edge Function Configuration Verification Script
 * 
 * This script verifies:
 * 1. SMTP settings for email alerts
 * 2. Edge Function scheduling
 * 3. Basic connectivity to the functions
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Edge Function Configuration Verification');
  console.log('=======================================');
  
  // Step 1: Verify SMTP Configuration
  console.log('\n1. Verifying SMTP Configuration...');
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
    console.error('❌ Error: Missing SMTP configuration in .env file');
    console.log('Required variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM');
  } else {
    console.log('✅ SMTP configuration found in .env file');
    
    try {
      // Test SMTP connection
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });
      
      console.log('   Attempting to verify SMTP connection...');
      await transporter.verify();
      console.log('✅ SMTP connection successful');
    } catch (error) {
      console.error(`❌ SMTP connection failed: ${error.message}`);
      console.log('   NOTE: This might be expected in development environments with placeholder credentials');
    }
  }
  
  // Step 2: Verify Edge Functions Exist
  console.log('\n2. Verifying Edge Functions...');
  try {
    // Ping the security alert monitor function
    console.log('   Checking security alert monitor function...');
    const alertResponse = await fetch(
      `${supabaseUrl}/functions/v1/app_2d776e4976_security_alert_monitor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (alertResponse.ok) {
      console.log('✅ Security alert monitor function is accessible');
    } else {
      console.error(`❌ Security alert monitor function returned error: ${alertResponse.status}`);
    }
    
    // Ping the rate limit cleanup function
    console.log('   Checking rate limit cleanup function...');
    const cleanupResponse = await fetch(
      `${supabaseUrl}/functions/v1/app_2d776e4976_cleanup_rate_limits`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (cleanupResponse.ok) {
      console.log('✅ Rate limit cleanup function is accessible');
    } else {
      console.error(`❌ Rate limit cleanup function returned error: ${cleanupResponse.status}`);
    }
  } catch (error) {
    console.error(`❌ Error checking edge functions: ${error.message}`);
  }
  
  // Step 3: Verify Scheduled Jobs
  console.log('\n3. Verifying Scheduled Jobs...');
  try {
    // Query the scheduled jobs view
    const { data: jobs, error } = await supabase
      .from('app_2d776e4976_scheduled_jobs')
      .select('*');
    
    if (error) {
      console.error(`❌ Error querying scheduled jobs: ${error.message}`);
      console.log('   Note: You may need to run the scheduling SQL script first');
    } else if (!jobs || jobs.length === 0) {
      console.error('❌ No scheduled jobs found');
      console.log('   Note: You need to run the scheduling SQL script first');
    } else {
      console.log(`✅ Found ${jobs.length} scheduled jobs:`);
      jobs.forEach(job => {
        console.log(`   - ${job.jobname}: ${job.schedule} (active: ${job.active ? 'yes' : 'no'})`);
      });
    }
  } catch (error) {
    console.error(`❌ Error checking scheduled jobs: ${error.message}`);
  }
  
  console.log('\nVerification complete. Fix any issues marked with ❌');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});