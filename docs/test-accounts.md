# Vuebie Test Accounts Documentation

## Authentication Security Updates

We have implemented the following security updates:

1. **Route Protection**: All dashboard and admin routes are now wrapped with a `ProtectedRoute` component that:
   - Verifies user authentication status
   - Redirects unauthenticated users to login
   - Validates role-based access permissions

2. **Improved Error Handling**: Login failures now display specific error messages for:
   - Invalid credentials
   - Unregistered emails
   - Server errors

3. **Role-Based Access Control**: Users can only access routes appropriate to their role:
   - Merchant users: Dashboard, outlets, QR codes, incentives, etc.
   - Admin users: Admin-only sections
   - Super Admin users: All platform sections
   - Customer users: Only customer-facing features

## Valid Test Accounts

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| test.merchant@vuebie.com | TestMerchant123! | merchant | Access to merchant dashboard |
| test.admin@vuebie.com | TestAdmin123! | admin | Access to admin features |
| test.superadmin@vuebie.com | TestSuperAdmin123! | super_admin | Full platform access |
| test.customer@vuebie.com | TestCustomer123! | customer | Customer-only features |

## Login Behavior Documentation

### Successful Login
When a user enters valid credentials, they will:
1. See a success toast notification
2. Be redirected to their appropriate dashboard based on role
3. Have access only to features appropriate for their role

### Failed Login
When a user enters invalid credentials, they will:
1. See a specific error message based on the failure type:
   - "Invalid email or password" for incorrect credentials
   - Specific error messages for server-side failures
2. Remain on the login page
3. Be able to retry login

### Authentication Flow
1. User enters email and password
2. System validates credentials with Supabase
3. If valid, user profile is fetched including role information
4. User is directed to appropriate area based on role
5. If invalid, user sees error message

## Security Implementation Details

1. **ProtectedRoute Component**: `/src/components/auth/ProtectedRoute.tsx`
   - Central protection for all secured routes
   - Role-based access control
   - Loading state management

2. **Route Protection**: `/src/App.tsx`
   - All sensitive routes wrapped with ProtectedRoute
   - Role requirements specified for each route

3. **Login Validation**: `/src/pages/auth/LoginPage.tsx`
   - Improved error handling
   - Specific user feedback
   - Input validation