/**
 * Edge Function Monitoring Wrapper
 * 
 * This module provides wrappers for edge function calls to monitor performance
 * and track errors.
 */

import { PermissionMonitoringService } from './permission-monitoring';

/**
 * Function to wrap edge function calls with monitoring
 * 
 * @param functionName The name of the edge function being called
 * @param functionCall The async function that calls the edge function
 * @returns The result of the edge function call
 */
export async function monitorEdgeFunction<T>(
  functionName: string,
  functionCall: () => Promise<T>
): Promise<T> {
  const monitor = PermissionMonitoringService.getInstance();
  const startTime = performance.now();
  let success = false;
  
  try {
    // Execute the edge function
    const result = await functionCall();
    success = true;
    return result;
  } catch (error) {
    // Log the error but still capture metrics
    console.error(`Edge function ${functionName} failed:`, error);
    throw error;
  } finally {
    // Record metrics regardless of success or failure
    const latencyMs = performance.now() - startTime;
    monitor.recordEdgeFunctionCall(functionName, success, latencyMs);
  }
}

/**
 * Monitor specific edge function calls with typed return values
 */
export const monitoredEdgeFunctions = {
  /**
   * Monitored version of the check permission edge function
   */
  checkPermission: async <T>(
    call: () => Promise<T>
  ): Promise<T> => {
    return monitorEdgeFunction('app_0be8fb8541_check_permission', call);
  },
  
  /**
   * Monitored version of the manage user role edge function
   */
  manageUserRole: async <T>(
    call: () => Promise<T>
  ): Promise<T> => {
    return monitorEdgeFunction('app_0be8fb8541_manage_user_role', call);
  }
};