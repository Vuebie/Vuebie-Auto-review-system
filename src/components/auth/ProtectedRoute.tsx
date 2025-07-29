import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { errorMonitor } from '@/lib/error-monitoring';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = ['merchant', 'admin', 'super_admin'] 
}: ProtectedRouteProps) {
  console.log('🛡️ [PROTECTED ROUTE] Component mounting with requiredRoles:', requiredRoles);
  
  const { user, loading, roles, hasMerchantRole, hasAdminRole, hasSuperAdminRole } = useAuth();
  const location = useLocation();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  console.log('🛡️ [PROTECTED ROUTE] Auth state:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading, 
    isInitialLoading,
    roles,
    hasMerchantRole,
    hasAdminRole,
    hasSuperAdminRole,
    requiredRoles 
  });

  useEffect(() => {
    // Set a timeout to prevent flash of loading state for quick auth checks
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner only if it's taking longer than expected
  if ((loading || isInitialLoading) && !user) {
    console.log('🛡️ [PROTECTED ROUTE] Still loading - showing spinner', { loading, isInitialLoading, hasUser: !!user });
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
        <div className="ml-4 text-red-600 font-bold">🔍 DEBUG: ProtectedRoute loading state</div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    errorMonitor.logError('Unauthorized access attempt', {
      attemptedPath: location.pathname,
      userId: 'anonymous'
    });
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Enhanced role checking using the auth context role flags
  console.log('🛡️ [PROTECTED ROUTE] Starting role check...');
  const hasRequiredRole = requiredRoles.some(role => {
    console.log(`🛡️ [PROTECTED ROUTE] Checking role "${role}"`);
    let hasRole = false;
    switch (role) {
      case 'merchant':
        hasRole = hasMerchantRole || roles.includes('merchant');
        console.log(`🛡️ [PROTECTED ROUTE] Merchant role check: ${hasRole} (flag: ${hasMerchantRole}, in array: ${roles.includes('merchant')})`);
        return hasRole;
      case 'admin':
        hasRole = hasAdminRole || roles.includes('admin');
        console.log(`🛡️ [PROTECTED ROUTE] Admin role check: ${hasRole} (flag: ${hasAdminRole}, in array: ${roles.includes('admin')})`);
        return hasRole;
      case 'super_admin':
        hasRole = hasSuperAdminRole || roles.includes('super_admin');
        console.log(`🛡️ [PROTECTED ROUTE] Super admin role check: ${hasRole} (flag: ${hasSuperAdminRole}, in array: ${roles.includes('super_admin')})`);
        return hasRole;
      case 'customer':
        hasRole = roles.includes('customer');
        console.log(`🛡️ [PROTECTED ROUTE] Customer role check: ${hasRole}`);
        return hasRole;
      default:
        console.log(`🛡️ [PROTECTED ROUTE] Unknown role "${role}": false`);
        return false;
    }
  });
  
  console.log('🛡️ [PROTECTED ROUTE] Final hasRequiredRole result:', hasRequiredRole);

  if (!hasRequiredRole) {
    console.log('❌ [PROTECTED ROUTE] Insufficient permissions - redirecting to unauthorized');
    errorMonitor.logError('Insufficient permissions', {
      userId: user.id,
      userRoles: roles,
      requiredRoles: requiredRoles,
      attemptedPath: location.pathname
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ [PROTECTED ROUTE] All checks passed - rendering children');
  return <>{children}</>;
}