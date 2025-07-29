import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = ['merchant', 'admin', 'super_admin'] 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
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
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If roles are required and user doesn't have one of them, redirect
  const hasRequiredRole = requiredRoles.some(role => 
    role === 'merchant' ? user.role === 'merchant' : 
    role === 'admin' ? ['admin', 'super_admin'].includes(user.role || '') :
    role === 'super_admin' ? user.role === 'super_admin' : false
  );

  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}