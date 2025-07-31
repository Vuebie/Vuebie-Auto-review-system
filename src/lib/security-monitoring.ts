import { supabase, TABLES, isSupabaseConfigured } from './supabase-with-fallback';

export type SecurityEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  eventType: string;
  timestamp: string;
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  details: Record<string, unknown>;
}

export interface SuspiciousActivityResult {
  suspicious: boolean;
  reason?: string;
}

export interface EventCriteria {
  severity?: SecurityEventSeverity[];
  eventTypes?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private securityEvents: SecurityEvent[] = [];
  private highSeverityEvents: SecurityEvent[] = [];
  private thresholds = {
    loginAttempts: 5,
    loginWindow: 5 * 60 * 1000, // 5 minutes
    locationChangeTolerance: 500, // km
    suspiciousActivities: 3
  };
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event both in memory and to database
   */
  public async logSecurityEvent(
    eventType: string,
    details: Record<string, unknown>,
    severity: SecurityEventSeverity = 'MEDIUM'
  ): Promise<void> {
    try {
      // Create security event
      const securityEvent: SecurityEvent = {
        eventType,
        timestamp: new Date().toISOString(),
        severity,
        userId: details.userId as string,
        ipAddress: details.ipAddress as string,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        sessionId: this.generateSessionId(),
        details: this.sanitizeDetails({
          ...details,
          environment: import.meta.env?.MODE || 'unknown',
        })
      };

      // Add to memory storage (keep most recent 100 events)
      this.securityEvents.unshift(securityEvent);
      if (this.securityEvents.length > 100) {
        this.securityEvents.pop();
      }
      
      // Keep track of high severity events
      if (severity === 'HIGH' || severity === 'CRITICAL') {
        this.highSeverityEvents.push(securityEvent);
        
        // Keep only the most recent 50 high severity events
        if (this.highSeverityEvents.length > 50) {
          this.highSeverityEvents.shift();
        }
        
        // Alert on critical events
        if (severity === 'CRITICAL') {
          this.triggerSecurityAlert(securityEvent);
        }
      }

      // Log to console in development only
      if (import.meta.env?.MODE === 'development') {
        console.warn(`Security Event [${severity}]: ${eventType}`, 
          // Remove sensitive data from console logs
          this.sanitizeForConsole(securityEvent)
        );
      }

      // Persist security event
      await this.persistSecurityEvent(securityEvent);
    } catch (error) {
      console.error('Security monitoring failure:', error);
      // Don't throw, as this should never break app functionality
    }
  }

  /**
   * Check login patterns for suspicious activity
   */
  public async checkLoginPatterns(userId: string, email: string): Promise<SuspiciousActivityResult> {
    try {
      // Get recent login history for user
      const { data: loginHistory, error } = await supabase
        .from(TABLES.LOGIN_HISTORY)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error || !loginHistory || loginHistory.length === 0) {
        // First login or error fetching history - not suspicious
        return { suspicious: false };
      }
      
      // Check for rapid location changes
      if (loginHistory.length >= 2) {
        const currentLogin = loginHistory[0];
        const previousLogin = loginHistory[1];
        
        // If locations are available and significantly different
        if (currentLogin.location && previousLogin.location && 
            this.calculateLocationDistance(currentLogin.location, previousLogin.location) > this.thresholds.locationChangeTolerance) {
          
          // Check if the time between logins is short
          const currentTime = new Date(currentLogin.created_at).getTime();
          const previousTime = new Date(previousLogin.created_at).getTime();
          
          if (currentTime - previousTime < 24 * 60 * 60 * 1000) { // Less than 24 hours
            return { 
              suspicious: true, 
              reason: "Unusual location change detected" 
            };
          }
        }
      }
      
      // Check for multiple failed attempts followed by success
      const recentFailures = loginHistory.filter(
        log => !log.success && 
        (new Date(log.created_at).getTime() > Date.now() - this.thresholds.loginWindow)
      );
      
      if (recentFailures.length >= this.thresholds.loginAttempts) {
        return {
          suspicious: true,
          reason: "Multiple failed login attempts before success"
        };
      }
      
      // Check for unusual time of access (outside business hours)
      const currentTime = new Date();
      const hour = currentTime.getHours();
      if (hour < 6 || hour > 22) { // Before 6 AM or after 10 PM
        // Get user's typical login hours
        const typicalHours = await this.getUserTypicalLoginHours(userId);
        
        // If this hour is unusual for the user
        if (!typicalHours.includes(hour)) {
          return {
            suspicious: true,
            reason: "Unusual time of access"
          };
        }
      }
      
      // Check for new device/browser
      const currentAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      const hasUsedThisDeviceBefore = loginHistory.some(log => 
        log.user_agent === currentAgent && log.success
      );
      
      if (!hasUsedThisDeviceBefore && loginHistory.length > 1) {
        return {
          suspicious: true,
          reason: "Login from new device/browser"
        };
      }
      
      return { suspicious: false };
    } catch (error) {
      console.error('Error checking login patterns:', error);
      // In case of error, fail safe - don't block legitimate logins
      return { suspicious: false };
    }
  }

  /**
   * Get recent security events based on criteria
   */
  public async getRecentSecurityEvents(criteria: EventCriteria = {}): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from(TABLES.SECURITY_EVENTS)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId);
      }
      
      if (criteria.severity && criteria.severity.length > 0) {
        query = query.in('severity', criteria.severity);
      }
      
      if (criteria.eventTypes && criteria.eventTypes.length > 0) {
        query = query.in('event_type', criteria.eventTypes);
      }
      
      if (criteria.startDate) {
        query = query.gte('created_at', criteria.startDate);
      }
      
      if (criteria.endDate) {
        query = query.lte('created_at', criteria.endDate);
      }
      
      query = query.limit(criteria.limit || 100);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data.map(event => ({
        eventType: event.event_type,
        timestamp: event.created_at,
        severity: event.severity as SecurityEventSeverity,
        userId: event.user_id,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
        url: event.url,
        sessionId: event.session_id,
        details: event.details
      }));
    } catch (error) {
      console.error('Error fetching security events:', error);
      // Return in-memory events as fallback
      return this.securityEvents;
    }
  }

  /**
   * Get high severity events from memory
   */
  public getHighSeverityEvents(): SecurityEvent[] {
    return [...this.highSeverityEvents];
  }

  /**
   * Persist a security event to the database
   */
  private async persistSecurityEvent(event: SecurityEvent): Promise<void> {
    // Skip database operations in mock mode
    if (!isSupabaseConfigured()) {
      console.log('Security event logged (mock mode):', {
        eventType: event.eventType,
        severity: event.severity,
        userId: event.userId,
        timestamp: event.timestamp
      });
      return;
    }

    try {
      await supabase
        .from(TABLES.SECURITY_EVENTS)
        .insert({
          event_type: event.eventType,
          severity: event.severity,
          user_id: event.userId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          url: event.url,
          session_id: event.sessionId,
          details: event.details,
          created_at: event.timestamp
        });
    } catch (error) {
      console.error('Failed to persist security event:', error);
      // Don't throw, as this should never break app functionality
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Trigger a security alert for critical events
   */
  private triggerSecurityAlert(event: SecurityEvent): void {
    // In a production system, this would send an alert to a security team
    // For now, we'll just log to console in all environments
    console.error('🚨 SECURITY ALERT:', {
      eventType: event.eventType,
      severity: event.severity,
      timestamp: event.timestamp,
      userId: event.userId,
      ipAddress: event.ipAddress
    });
    
    // In a real implementation, this could:
    // 1. Send an email to the security team
    // 2. Create an incident ticket
    // 3. Send a push notification to admin app
    // 4. Log to an external security monitoring service
  }

  /**
   * Get typical login hours for a user
   */
  private async getUserTypicalLoginHours(userId: string): Promise<number[]> {
    try {
      const { data: loginHistory, error } = await supabase
        .from(TABLES.LOGIN_HISTORY)
        .select('created_at')
        .eq('user_id', userId)
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error || !loginHistory || loginHistory.length < 3) {
        // Not enough history to determine pattern, return all hours as acceptable
        return Array.from({ length: 24 }, (_, i) => i);
      }
      
      // Count login frequency by hour
      const hourCounts: Record<number, number> = {};
      loginHistory.forEach(login => {
        const hour = new Date(login.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      // Find hours with at least 2 logins
      return Object.entries(hourCounts)
        .filter(([_, count]) => count >= 2)
        .map(([hour]) => parseInt(hour));
    } catch (error) {
      console.error('Error getting user login patterns:', error);
      // Return all hours as acceptable in case of error
      return Array.from({ length: 24 }, (_, i) => i);
    }
  }

  /**
   * Calculate approximate distance between two locations
   */
  private calculateLocationDistance(loc1: string, loc2: string): number {
    // This is a simplified implementation
    // In a real system, you would use proper geolocation coordinates and distance calculation
    // For now, we'll just check if the locations are different
    return loc1 !== loc2 ? 1000 : 0;
  }

  /**
   * Sanitize security event details to remove sensitive information
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...details };
    
    // Remove sensitive data
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize security event for console logging
   */
  private sanitizeForConsole(event: SecurityEvent): Record<string, unknown> {
    const { userId, eventType, severity, timestamp } = event;
    
    // Return minimal information for console logs
    return {
      userId: userId ? userId.substring(0, 8) + '...' : undefined,
      eventType,
      severity,
      timestamp
    };
  }
}

export const securityMonitor = SecurityMonitor.getInstance();