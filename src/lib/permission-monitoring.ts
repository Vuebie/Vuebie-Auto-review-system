/**
 * Permission Monitoring Service
 * 
 * This service captures metrics from the permission system including:
 * - Cache performance (hits, misses, invalidations)
 * - Permission checks (success/failure rates, latency)
 * - Role management (assignments, removals)
 * - Security events (unauthorized attempts, permission denials)
 * - Edge function performance
 */

import { supabase } from './supabase';

// Define metric data types
interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  size: number;
}

interface PermissionMetrics {
  checks: number;
  granted: number;
  denied: number;
  byResource: Record<string, number>;
  byAction: Record<string, number>;
  latencies: number[];
}

interface RoleMetrics {
  assignments: number;
  removals: number;
  byRole: Record<string, number>;
}

interface SecurityMetrics {
  unauthorizedAttempts: number;
  deniedByResource: Record<string, number>;
}

interface EdgeFunctionMetrics {
  calls: number;
  errors: number;
  latencies: number[];
  byFunction: Record<string, { 
    calls: number; 
    errors: number; 
    latencies: number[];
  }>;
}

interface MetricsSnapshot {
  timestamp: Date;
  cache: CacheMetrics;
  permissions: PermissionMetrics;
  roles: RoleMetrics;
  security: SecurityMetrics;
  edgeFunctions: EdgeFunctionMetrics;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Permission Monitoring Service - Singleton class
 */
export class PermissionMonitoringService {
  private static instance: PermissionMonitoringService;
  
  // In-memory metrics storage
  private metrics = {
    cache: {
      hits: 0,
      misses: 0,
      invalidations: 0,
      size: 0
    } as CacheMetrics,
    
    permissions: {
      checks: 0,
      granted: 0,
      denied: 0,
      byResource: {},
      byAction: {},
      latencies: []
    } as PermissionMetrics,
    
    roles: {
      assignments: 0,
      removals: 0,
      byRole: {}
    } as RoleMetrics,
    
    security: {
      unauthorizedAttempts: 0,
      deniedByResource: {}
    } as SecurityMetrics,
    
    edgeFunctions: {
      calls: 0,
      errors: 0,
      latencies: [],
      byFunction: {}
    } as EdgeFunctionMetrics,
    
    snapshots: [] as MetricsSnapshot[],
    alerts: [] as Alert[]
  };
  
  // Alert thresholds
  private alertThresholds = {
    cacheHitRate: 0.7,               // Alert if hit rate below 70%
    permissionDenialRate: 0.1,       // Alert if >10% of permission checks are denied
    edgeFunctionErrorRate: 0.05,     // Alert if >5% of edge function calls error
    permissionLatencyAvg: 200,       // Alert if average latency >200ms
    unauthorizedAttempts: 5,         // Alert if >5 unauthorized attempts in 5 mins
    edgeFunctionLatencyAvg: 500      // Alert if average latency >500ms
  };
  
  // Database tables for metrics
  private readonly METRICS_TABLE = 'permission_metrics';
  private readonly ALERTS_TABLE = 'permission_alerts';
  
  // Time of last metrics persistence
  private lastPersistTime = new Date();
  
  // Persistence interval (5 minutes)
  private persistInterval = 5 * 60 * 1000;
  
  // Private constructor (singleton pattern)
  private constructor() {
    // Set up periodic tasks if in browser environment
    if (typeof window !== 'undefined') {
      this.setupPeriodicTasks();
    }
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PermissionMonitoringService {
    if (!PermissionMonitoringService.instance) {
      PermissionMonitoringService.instance = new PermissionMonitoringService();
    }
    return PermissionMonitoringService.instance;
  }
  
  /**
   * Set up periodic tasks for snapshots and persistence
   */
  private setupPeriodicTasks(): void {
    // Take snapshots every minute
    setInterval(() => {
      this.takeSnapshot();
    }, 60 * 1000);
    
    // Persist metrics every 5 minutes
    setInterval(() => {
      this.persistMetrics();
    }, this.persistInterval);
  }
  
  /**
   * Take a snapshot of current metrics for historical tracking
   */
  private takeSnapshot(): void {
    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      cache: { ...this.metrics.cache },
      permissions: {
        ...this.metrics.permissions,
        byResource: { ...this.metrics.permissions.byResource },
        byAction: { ...this.metrics.permissions.byAction },
        latencies: [...this.metrics.permissions.latencies]
      },
      roles: {
        ...this.metrics.roles,
        byRole: { ...this.metrics.roles.byRole }
      },
      security: {
        ...this.metrics.security,
        deniedByResource: { ...this.metrics.security.deniedByResource }
      },
      edgeFunctions: {
        ...this.metrics.edgeFunctions,
        latencies: [...this.metrics.edgeFunctions.latencies],
        byFunction: Object.entries(this.metrics.edgeFunctions.byFunction).reduce(
          (acc, [key, val]) => {
            acc[key] = {
              calls: val.calls,
              errors: val.errors,
              latencies: [...val.latencies]
            };
            return acc;
          },
          {} as Record<string, { calls: number; errors: number; latencies: number[] }>
        )
      }
    };
    
    this.metrics.snapshots.push(snapshot);
    
    // Keep only 24 hours of minute snapshots (1440 snapshots)
    if (this.metrics.snapshots.length > 1440) {
      this.metrics.snapshots = this.metrics.snapshots.slice(-1440);
    }
    
    // Check for alerts based on new snapshot
    this.checkForAlerts();
  }
  
  // METRIC RECORDING METHODS
  
  /**
   * Record a cache hit
   */
  public recordCacheHit(): void {
    this.metrics.cache.hits++;
  }
  
  /**
   * Record a cache miss
   */
  public recordCacheMiss(): void {
    this.metrics.cache.misses++;
  }
  
  /**
   * Record a cache invalidation
   */
  public recordCacheInvalidation(): void {
    this.metrics.cache.invalidations++;
  }
  
  /**
   * Update cache size
   */
  public updateCacheSize(size: number): void {
    this.metrics.cache.size = size;
  }
  
  /**
   * Record a permission check
   */
  public recordPermissionCheck(
    resource: string,
    action: string,
    granted: boolean,
    latencyMs: number
  ): void {
    // Increment total checks
    this.metrics.permissions.checks++;
    
    // Record result
    if (granted) {
      this.metrics.permissions.granted++;
    } else {
      this.metrics.permissions.denied++;
      
      // Track denials by resource for security metrics
      if (!this.metrics.security.deniedByResource[resource]) {
        this.metrics.security.deniedByResource[resource] = 0;
      }
      this.metrics.security.deniedByResource[resource]++;
      
      // Track sensitive resources as unauthorized attempts
      if (['users', 'roles', 'permissions', 'audit_logs'].includes(resource)) {
        this.metrics.security.unauthorizedAttempts++;
      }
    }
    
    // Track by resource
    if (!this.metrics.permissions.byResource[resource]) {
      this.metrics.permissions.byResource[resource] = 0;
    }
    this.metrics.permissions.byResource[resource]++;
    
    // Track by action
    if (!this.metrics.permissions.byAction[action]) {
      this.metrics.permissions.byAction[action] = 0;
    }
    this.metrics.permissions.byAction[action]++;
    
    // Track latency
    this.metrics.permissions.latencies.push(latencyMs);
    
    // Keep array at reasonable size
    if (this.metrics.permissions.latencies.length > 1000) {
      this.metrics.permissions.latencies = this.metrics.permissions.latencies.slice(-1000);
    }
  }
  
  /**
   * Record a role assignment
   */
  public recordRoleAssignment(roleName: string): void {
    this.metrics.roles.assignments++;
    
    // Track by role
    if (!this.metrics.roles.byRole[roleName]) {
      this.metrics.roles.byRole[roleName] = 0;
    }
    this.metrics.roles.byRole[roleName]++;
  }
  
  /**
   * Record a role removal
   */
  public recordRoleRemoval(roleName: string): void {
    this.metrics.roles.removals++;
    
    // Update role count
    if (this.metrics.roles.byRole[roleName] && this.metrics.roles.byRole[roleName] > 0) {
      this.metrics.roles.byRole[roleName]--;
    }
  }
  
  /**
   * Record an edge function call
   */
  public recordEdgeFunctionCall(
    functionName: string,
    success: boolean,
    latencyMs: number
  ): void {
    // Total metrics
    this.metrics.edgeFunctions.calls++;
    if (!success) {
      this.metrics.edgeFunctions.errors++;
    }
    this.metrics.edgeFunctions.latencies.push(latencyMs);
    
    // Per-function metrics
    if (!this.metrics.edgeFunctions.byFunction[functionName]) {
      this.metrics.edgeFunctions.byFunction[functionName] = {
        calls: 0,
        errors: 0,
        latencies: []
      };
    }
    
    const funcMetrics = this.metrics.edgeFunctions.byFunction[functionName];
    funcMetrics.calls++;
    if (!success) {
      funcMetrics.errors++;
    }
    funcMetrics.latencies.push(latencyMs);
    
    // Keep arrays at reasonable sizes
    if (this.metrics.edgeFunctions.latencies.length > 1000) {
      this.metrics.edgeFunctions.latencies = this.metrics.edgeFunctions.latencies.slice(-1000);
    }
    
    if (funcMetrics.latencies.length > 500) {
      funcMetrics.latencies = funcMetrics.latencies.slice(-500);
    }
  }
  
  // ALERTING METHODS
  
  /**
   * Check for alert conditions based on metrics
   */
  private checkForAlerts(): void {
    const alerts: Partial<Alert>[] = [];
    const now = new Date();
    
    // Check cache hit rate
    const totalCacheAttempts = this.metrics.cache.hits + this.metrics.cache.misses;
    if (totalCacheAttempts > 20) { // Only alert if we have sufficient data
      const hitRate = this.metrics.cache.hits / totalCacheAttempts;
      if (hitRate < this.alertThresholds.cacheHitRate) {
        alerts.push({
          type: 'LOW_CACHE_HIT_RATE',
          message: `Cache hit rate is ${(hitRate * 100).toFixed(1)}%, which is below threshold of ${(this.alertThresholds.cacheHitRate * 100).toFixed(1)}%`,
          severity: 'warning',
          timestamp: now
        });
      }
    }
    
    // Check permission denial rate
    const totalPermissionChecks = this.metrics.permissions.checks;
    if (totalPermissionChecks > 20) {
      const denialRate = this.metrics.permissions.denied / totalPermissionChecks;
      if (denialRate > this.alertThresholds.permissionDenialRate) {
        alerts.push({
          type: 'HIGH_PERMISSION_DENIAL_RATE',
          message: `Permission denial rate is ${(denialRate * 100).toFixed(1)}%, which exceeds threshold of ${(this.alertThresholds.permissionDenialRate * 100).toFixed(1)}%`,
          severity: 'warning',
          timestamp: now
        });
      }
    }
    
    // Check edge function error rate
    const totalEdgeFunctionCalls = this.metrics.edgeFunctions.calls;
    if (totalEdgeFunctionCalls > 10) {
      const errorRate = this.metrics.edgeFunctions.errors / totalEdgeFunctionCalls;
      if (errorRate > this.alertThresholds.edgeFunctionErrorRate) {
        alerts.push({
          type: 'HIGH_EDGE_FUNCTION_ERROR_RATE',
          message: `Edge function error rate is ${(errorRate * 100).toFixed(1)}%, which exceeds threshold of ${(this.alertThresholds.edgeFunctionErrorRate * 100).toFixed(1)}%`,
          severity: 'error',
          timestamp: now
        });
      }
    }
    
    // Check average permission latency
    const permissionLatencies = this.metrics.permissions.latencies;
    if (permissionLatencies.length > 20) {
      const avgLatency = permissionLatencies.reduce((sum, val) => sum + val, 0) / permissionLatencies.length;
      if (avgLatency > this.alertThresholds.permissionLatencyAvg) {
        alerts.push({
          type: 'HIGH_PERMISSION_LATENCY',
          message: `Average permission check latency is ${avgLatency.toFixed(1)}ms, which exceeds threshold of ${this.alertThresholds.permissionLatencyAvg}ms`,
          severity: 'warning',
          timestamp: now
        });
      }
    }
    
    // Check average edge function latency
    const edgeFunctionLatencies = this.metrics.edgeFunctions.latencies;
    if (edgeFunctionLatencies.length > 10) {
      const avgLatency = edgeFunctionLatencies.reduce((sum, val) => sum + val, 0) / edgeFunctionLatencies.length;
      if (avgLatency > this.alertThresholds.edgeFunctionLatencyAvg) {
        alerts.push({
          type: 'HIGH_EDGE_FUNCTION_LATENCY',
          message: `Average edge function latency is ${avgLatency.toFixed(1)}ms, which exceeds threshold of ${this.alertThresholds.edgeFunctionLatencyAvg}ms`,
          severity: 'warning',
          timestamp: now
        });
      }
    }
    
    // Check unauthorized attempts (over last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentSnapshots = this.metrics.snapshots.filter(s => s.timestamp >= fiveMinutesAgo);
    
    if (recentSnapshots.length > 0) {
      const recentUnauthorizedAttempts = recentSnapshots.reduce(
        (sum, s) => sum + s.security.unauthorizedAttempts,
        0
      );
      
      if (recentUnauthorizedAttempts >= this.alertThresholds.unauthorizedAttempts) {
        alerts.push({
          type: 'MULTIPLE_UNAUTHORIZED_ATTEMPTS',
          message: `${recentUnauthorizedAttempts} unauthorized access attempts detected in the last 5 minutes`,
          severity: 'error',
          timestamp: now
        });
      }
    }
    
    // Add any new alerts to the list
    if (alerts.length > 0) {
      // Generate IDs and set acknowledged to false
      const fullAlerts: Alert[] = alerts.map(alert => ({
        ...alert,
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        acknowledged: false
      } as Alert));
      
      this.metrics.alerts.push(...fullAlerts);
      
      // Store alerts in database
      this.persistAlerts(fullAlerts);
      
      console.warn('Permission system alerts:', fullAlerts);
    }
  }
  
  /**
   * Persist alerts to database
   */
  private async persistAlerts(alerts: Alert[]): Promise<void> {
    try {
      for (const alert of alerts) {
        await supabase
          .from(this.ALERTS_TABLE)
          .insert({
            alert_id: alert.id,
            alert_type: alert.type,
            message: alert.message,
            severity: alert.severity,
            timestamp: alert.timestamp.toISOString(),
            acknowledged: alert.acknowledged
          });
      }
    } catch (error) {
      console.error('Error persisting alerts:', error);
    }
  }
  
  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      // Update in-memory
      const alert = this.metrics.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
      
      // Update in database
      await supabase
        .from(this.ALERTS_TABLE)
        .update({ acknowledged: true })
        .eq('alert_id', alertId);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }
  
  /**
   * Get active (unacknowledged) alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.metrics.alerts.filter(a => !a.acknowledged);
  }
  
  /**
   * Persist metrics to database
   */
  private async persistMetrics(): Promise<void> {
    try {
      const metrics = this.getMetrics().summary;
      const metricsJson = JSON.stringify(metrics);
      
      await supabase
        .from(this.METRICS_TABLE)
        .insert({
          timestamp: new Date().toISOString(),
          metrics_data: metricsJson
        });
      
      this.lastPersistTime = new Date();
    } catch (error) {
      console.error('Error persisting metrics:', error);
    }
  }
  
  // DATA ACCESS METHODS
  
  /**
   * Get metrics for dashboard display
   */
  public getMetrics(): { summary: Record<string, unknown>; historical: Record<string, unknown> } {
    // Calculate derived metrics
    const totalCacheAttempts = this.metrics.cache.hits + this.metrics.cache.misses;
    const cacheHitRate = totalCacheAttempts > 0 
      ? this.metrics.cache.hits / totalCacheAttempts 
      : 0;
    
    const permissionLatencies = this.metrics.permissions.latencies;
    const avgPermissionLatency = permissionLatencies.length > 0
      ? permissionLatencies.reduce((sum, val) => sum + val, 0) / permissionLatencies.length
      : 0;
    
    const edgeFunctionLatencies = this.metrics.edgeFunctions.latencies;
    const avgEdgeFunctionLatency = edgeFunctionLatencies.length > 0
      ? edgeFunctionLatencies.reduce((sum, val) => sum + val, 0) / edgeFunctionLatencies.length
      : 0;
    
    // Current metrics summary
    const summary = {
      timestamp: new Date(),
      
      cache: {
        hitRate: cacheHitRate,
        hits: this.metrics.cache.hits,
        misses: this.metrics.cache.misses,
        invalidations: this.metrics.cache.invalidations,
        size: this.metrics.cache.size
      },
      
      permissions: {
        total: this.metrics.permissions.checks,
        granted: this.metrics.permissions.granted,
        denied: this.metrics.permissions.denied,
        grantRate: this.metrics.permissions.checks > 0
          ? this.metrics.permissions.granted / this.metrics.permissions.checks
          : 0,
        avgLatency: avgPermissionLatency,
        topResources: this.getTopResources(5),
        topActions: this.getTopActions(5)
      },
      
      roles: {
        assignments: this.metrics.roles.assignments,
        removals: this.metrics.roles.removals,
        distribution: this.metrics.roles.byRole
      },
      
      security: {
        unauthorizedAttempts: this.metrics.security.unauthorizedAttempts,
        totalDenials: Object.values(this.metrics.security.deniedByResource)
          .reduce((sum, val) => sum + val, 0),
        byResource: this.metrics.security.deniedByResource
      },
      
      edgeFunctions: {
        calls: this.metrics.edgeFunctions.calls,
        errors: this.metrics.edgeFunctions.errors,
        errorRate: this.metrics.edgeFunctions.calls > 0
          ? this.metrics.edgeFunctions.errors / this.metrics.edgeFunctions.calls
          : 0,
        avgLatency: avgEdgeFunctionLatency,
        byFunction: Object.entries(this.metrics.edgeFunctions.byFunction).reduce(
          (acc, [key, val]) => {
            const functionLatencies = val.latencies;
            acc[key] = {
              calls: val.calls,
              errors: val.errors,
              errorRate: val.calls > 0 ? val.errors / val.calls : 0,
              avgLatency: functionLatencies.length > 0
                ? functionLatencies.reduce((sum, latency) => sum + latency, 0) / functionLatencies.length
                : 0
            };
            return acc;
          },
          {} as Record<string, { calls: number; errors: number; errorRate: number; avgLatency: number }>
        )
      }
    };
    
    // Historical data for charts
    const historical = {
      timestamps: this.metrics.snapshots.map(s => s.timestamp),
      
      cache: {
        hitRates: this.metrics.snapshots.map(s => {
          const total = s.cache.hits + s.cache.misses;
          return total > 0 ? s.cache.hits / total : 0;
        }),
        sizes: this.metrics.snapshots.map(s => s.cache.size)
      },
      
      permissions: {
        checks: this.metrics.snapshots.map(s => s.permissions.checks),
        grantRates: this.metrics.snapshots.map(s => {
          return s.permissions.checks > 0
            ? s.permissions.granted / s.permissions.checks
            : 0;
        }),
        avgLatencies: this.metrics.snapshots.map(s => {
          const latencies = s.permissions.latencies;
          return latencies.length > 0
            ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
            : 0;
        })
      },
      
      security: {
        denials: this.metrics.snapshots.map(s => {
          return Object.values(s.security.deniedByResource)
            .reduce((sum, val) => sum + val, 0);
        }),
        unauthorizedAttempts: this.metrics.snapshots.map(s => s.security.unauthorizedAttempts)
      },
      
      edgeFunctions: {
        errorRates: this.metrics.snapshots.map(s => {
          return s.edgeFunctions.calls > 0
            ? s.edgeFunctions.errors / s.edgeFunctions.calls
            : 0;
        }),
        avgLatencies: this.metrics.snapshots.map(s => {
          const latencies = s.edgeFunctions.latencies;
          return latencies.length > 0
            ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
            : 0;
        })
      }
    };
    
    return { summary, historical };
  }
  
  /**
   * Get top N resources by count
   */
  private getTopResources(limit: number): Record<string, number> {
    return this.getTopByCount(this.metrics.permissions.byResource, limit);
  }
  
  /**
   * Get top N actions by count
   */
  private getTopActions(limit: number): Record<string, number> {
    return this.getTopByCount(this.metrics.permissions.byAction, limit);
  }
  
  /**
   * Helper to get top items by count
   */
  private getTopByCount(record: Record<string, number>, limit: number): Record<string, number> {
    return Object.entries(record)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, number>);
  }
  
  /**
   * Set alert thresholds
   */
  public setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...thresholds
    };
  }
  
  /**
   * Reset metrics (for testing)
   */
  public resetMetrics(): void {
    this.metrics = {
      cache: { hits: 0, misses: 0, invalidations: 0, size: 0 },
      permissions: { checks: 0, granted: 0, denied: 0, byResource: {}, byAction: {}, latencies: [] },
      roles: { assignments: 0, removals: 0, byRole: {} },
      security: { unauthorizedAttempts: 0, deniedByResource: {} },
      edgeFunctions: { calls: 0, errors: 0, latencies: [], byFunction: {} },
      snapshots: [],
      alerts: []
    };
  }
}