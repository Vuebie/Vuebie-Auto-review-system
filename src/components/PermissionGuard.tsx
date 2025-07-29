/**
 * PermissionGuard Component
 * 
 * A component that conditionally renders its children based on user permissions.
 * If the user has the specified permission, the children are rendered.
 * Otherwise, it renders the fallback component or nothing.
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  /** The resource to check permission against */
  resource: string;
  
  /** The action to check permission for */
  action: string;
  
  /** Content to render if permission is granted */
  children: ReactNode;
  
  /** Optional fallback content to render if permission is denied */
  fallback?: ReactNode;
  
  /**
   * If true, use checkPermission (server-side check) instead of hasPermission (client-side check)
   * Useful when permissions may have changed and cache hasn't been updated
   */
  forceCheck?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback = null,
  forceCheck = false,
}) => {
  const { user, checkPermission, hasPermission } = useAuth();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyPermission = async () => {
      // If no user, definitely no permission
      if (!user) {
        setCanAccess(false);
        setIsLoading(false);
        return;
      }

      let hasAccess = false;
      
      // Use server-side check if forceCheck is true, otherwise use cached client-side check
      if (forceCheck) {
        hasAccess = await checkPermission(resource, action);
      } else {
        hasAccess = hasPermission(resource, action);
      }
      
      setCanAccess(hasAccess);
      setIsLoading(false);
    };

    verifyPermission();
  }, [user, resource, action, checkPermission, hasPermission, forceCheck]);

  // While loading, return null to avoid flash of wrong content
  if (isLoading) {
    return null;
  }

  // If has permission, render children, otherwise render fallback or null
  return canAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Higher-order component version of PermissionGuard
 * @param Component The component to wrap
 * @param resource The resource to check permission against
 * @param action The action to check permission for
 * @returns A wrapped component that only renders if the user has permission
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  action: string
): React.FC<P> {
  return (props: P) => (
    <PermissionGuard resource={resource} action={action}>
      <Component {...props} />
    </PermissionGuard>
  );
}

export default PermissionGuard;