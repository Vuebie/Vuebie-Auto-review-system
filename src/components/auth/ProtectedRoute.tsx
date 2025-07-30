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
  const { user, loading, roles, hasMerchantRole, hasAdminRole, hasSuperAdminRole } = useAuth();
  const location = useLocation();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  useEffect(() => {
    // Set a timeout to prevent flash of loading state for quick auth checks
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner only if it's taking longer than expected
  if ((loading || isInitialLoading) && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
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
  const hasRequiredRole = requiredRoles.some(role => {
    let hasRole = false;
    switch (role) {
      case 'merchant':
        hasRole = hasMerchantRole || roles.includes('merchant');
        return hasRole;
      case 'admin':
        hasRole = hasAdminRole || roles.includes('admin');
        return hasRole;
      case 'super_admin':
        hasRole = hasSuperAdminRole || roles.includes('super_admin');
        return hasRole;
      case 'customer':
        hasRole = roles.includes('customer');
        return hasRole;
      default:
        return false;
    }
  });

  if (!hasRequiredRole) {
    errorMonitor.logError('Insufficient permissions', {
      userId: user.id,
      userRoles: roles,
      requiredRoles: requiredRoles,
      attemptedPath: location.pathname
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}