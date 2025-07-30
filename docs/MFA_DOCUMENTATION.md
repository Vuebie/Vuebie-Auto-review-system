# Multi-Factor Authentication (MFA) Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Setup MFA](#setup-mfa)
3. [Login with MFA](#login-with-mfa)
4. [Recovery Codes](#recovery-codes)
5. [Disabling MFA](#disabling-mfa)
6. [Admin Configuration](#admin-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Introduction

Multi-Factor Authentication (MFA) provides an additional layer of security for your Vuebie account. With MFA enabled, you'll need both your password and a time-based one-time password (TOTP) from your authenticator app to sign in. This helps protect your account even if your password is compromised.

### Supported Authenticator Apps

- Google Authenticator ([Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2), [iOS](https://apps.apple.com/us/app/google-authenticator/id388497605))
- Microsoft Authenticator ([Android](https://play.google.com/store/apps/details?id=com.azure.authenticator), [iOS](https://apps.apple.com/us/app/microsoft-authenticator/id983156458))
- Authy ([Android](https://play.google.com/store/apps/details?id=com.authy.authy), [iOS](https://apps.apple.com/us/app/authy/id494168017))

## Setup MFA

### For Regular Users

1. **Navigate to Security Settings**:
   - Log into your Vuebie account
   - Go to your profile menu (top right corner)
   - Select "Settings" > "Security"

2. **Enable MFA**:
   - In the "Multi-Factor Authentication" section, click the "Setup MFA" button
   - This will take you to the MFA setup page

3. **Setup Your Authenticator App**:
   - Download and install one of the supported authenticator apps if you don't have one already
   - Scan the QR code displayed on the MFA setup page with your authenticator app
   - Alternatively, you can manually enter the provided secret key

4. **Verify Setup**:
   - Enter the 6-digit code from your authenticator app in the verification field
   - Click "Verify" to complete the setup

5. **Save Recovery Codes**:
   - After successful verification, you'll be presented with a set of recovery codes
   - Download, print, or copy these codes and store them in a secure location
   - These codes will help you regain access to your account if you lose your device

### For Admin Users

If you have an admin role, MFA is required for your account:

1. After logging in for the first time (or after the MFA requirement is enabled), you'll be redirected to the MFA setup page
2. Follow steps 3-5 from the regular user setup above
3. MFA will be enforced, and you won't be able to disable it

## Login with MFA

1. **Enter Credentials**:
   - Navigate to the login page
   - Enter your email and password
   - Click "Sign In"

2. **Enter MFA Code**:
   - After successful password verification, you'll be prompted for your MFA code
   - Open your authenticator app and enter the 6-digit code
   - Click "Verify"

3. **Alternative: Use Recovery Code**:
   - If you don't have access to your authenticator app, click the "Use Recovery Code" tab
   - Enter one of your recovery codes
   - Click "Verify"
   - Note: Each recovery code can only be used once

## Recovery Codes

Recovery codes are single-use codes that can be used to access your account if you can't access your authenticator app.

### View Recovery Codes

1. Navigate to "Settings" > "Security"
2. In the MFA section, click "View Recovery Codes"
3. Verify your identity by entering your MFA code
4. Your recovery codes will be displayed

### Generate New Recovery Codes

1. Navigate to "Settings" > "Security" > "Recovery Codes"
2. Click "Regenerate Codes"
3. Verify your identity by entering your MFA code
4. New recovery codes will be generated and displayed
5. **Important**: When you generate new recovery codes, all previous codes become invalid

## Disabling MFA

**Note**: If MFA is required for your role (admin, super_admin), you cannot disable MFA.

1. Navigate to "Settings" > "Security"
2. In the MFA section, click "Disable MFA"
3. Verify your identity by entering your MFA code
4. MFA will be disabled for your account

## Admin Configuration

### Enforcing MFA

For organization administrators:

1. MFA is automatically required for admin and super_admin roles
2. Users with these roles cannot disable MFA once enabled
3. New admin users will be prompted to set up MFA during their first login

### Role-Based Requirements

- **Regular Users**: MFA is recommended but optional
- **Admin Users**: MFA is required
- **Super Admin Users**: MFA is required

## Troubleshooting

### Lost Access to Authenticator App

If you've lost access to your authenticator app but have your recovery codes:

1. During login, select "Use Recovery Code" when prompted for MFA
2. Enter one of your recovery codes
3. After logging in, go to "Settings" > "Security" to set up MFA with a new device

If you've lost both your authenticator app and recovery codes:

1. Contact your organization administrator to reset your MFA
2. You'll need to verify your identity through alternative means

### Time Synchronization Issues

If your authenticator app is generating codes that are rejected:

1. Make sure your device's time is correctly synchronized
2. In Google Authenticator, tap the three dots > Settings > Time correction for codes > Sync now
3. In Microsoft Authenticator, tap the three dots > Settings > Time Correction

### Codes Not Working

- Make sure you're entering the most current code from your authenticator app
- Codes change every 30 seconds
- Check if your device's time is synchronized correctly
- If problems persist, try using a recovery code and then reconfigure MFA

## Security Best Practices

- **Enable MFA** for your account, even if it's not required for your role
- **Store recovery codes** securely (not in the same place as your password)
- **Don't share** your MFA device or recovery codes with others
- **Set up MFA** on multiple devices if possible (supported by most authenticator apps)
- **Regenerate recovery codes** periodically for enhanced security
- **Update your authenticator app** regularly

---

For additional support, please contact the IT support team at [support@vuebie.com](mailto:support@vuebie.com) or through the in-app support channel.