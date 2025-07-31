import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/ui/loading-screen';

// Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Main Pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));

// Settings Pages
const GeneralSettings = lazy(() => import('@/pages/settings/GeneralSettings'));
const SecuritySettings = lazy(() => import('@/pages/settings/security/SecuritySettings'));
const MFASetupPage = lazy(() => import('@/pages/settings/security/MFASetupPage'));
const RecoveryCodesPage = lazy(() => import('@/pages/settings/security/RecoveryCodesPage'));
const NotificationsSettings = lazy(() => import('@/pages/settings/NotificationsSettings'));
const AccountSettings = lazy(() => import('@/pages/settings/AccountSettings'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const MerchantManagement = lazy(() => import('@/pages/admin/MerchantManagement'));
const SecurityMonitoring = lazy(() => import('@/pages/admin/SecurityMonitoring'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const SystemSettings = lazy(() => import('@/pages/admin/SystemSettings'));

// Super Admin Pages
const SuperAdminPortal = lazy(() => import('@/pages/superadmin/SuperAdminPortal'));
const OrganizationManagement = lazy(() => import('@/pages/superadmin/OrganizationManagement'));
const SystemMonitoring = lazy(() => import('@/pages/superadmin/SystemMonitoring'));

// Protected Route Wrapper
interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: JSX.Element;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Role-based access check
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'super_admin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        
        {/* User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Settings Routes */}
        <Route path="/settings/general" element={
          <ProtectedRoute>
            <GeneralSettings />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/security" element={
          <ProtectedRoute>
            <SecuritySettings />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/security/mfa-setup" element={
          <ProtectedRoute>
            <MFASetupPage />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/security/recovery-codes" element={
          <ProtectedRoute>
            <RecoveryCodesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/notifications" element={
          <ProtectedRoute>
            <NotificationsSettings />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/account" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/merchants" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <MerchantManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/security" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SecurityMonitoring />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SystemSettings />
          </ProtectedRoute>
        } />
        
        {/* Super Admin Routes */}
        <Route path="/superadmin/dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminPortal />
          </ProtectedRoute>
        } />
        
        <Route path="/superadmin/organizations" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <OrganizationManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/superadmin/monitoring" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SystemMonitoring />
          </ProtectedRoute>
        } />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch All */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}