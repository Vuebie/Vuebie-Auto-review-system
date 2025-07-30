import { securityMonitor, SecurityEventSeverity } from './security-monitoring';

export interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

/**
 * Enhanced error monitoring class that includes security event logging
 */
class EnhancedErrorMonitor {
  private static instance: EnhancedErrorMonitor;
  private errors: ErrorReport[] = [];
  private maxStoredErrors: number = 50;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): EnhancedErrorMonitor {
    if (!EnhancedErrorMonitor.instance) {
      EnhancedErrorMonitor.instance = new EnhancedErrorMonitor();
    }
    return EnhancedErrorMonitor.instance;
  }

  /**
   * Log an error with additional context
   */
  public logError(error: Error | string, additionalData: Record<string, unknown> = {}): void {
    try {
      const errorMessage = error instanceof Error ? error.message : error;
      const stack = error instanceof Error ? error.stack : undefined;
      
      const sanitizedContext = this.sanitizeSensitiveData({
        ...additionalData,
        environment: import.meta.env?.MODE || 'unknown'
      });
      
      const errorReport: ErrorReport = {
        message: errorMessage,
        stack: stack,
        timestamp: new Date().toISOString(),
        context: sanitizedContext,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };
      
      // Add to memory storage (keep most recent errors)
      this.errors.unshift(errorReport);
      if (this.errors.length > this.maxStoredErrors) {
        this.errors.pop();
      }
      
      // Log to console in development only
      if (import.meta.env?.MODE === 'development') {
        console.error('Application Error:', errorReport);
      }
      
      // Determine if this is a security-related error
      const isSecurityError = this.isSecurityRelatedError(errorMessage, additionalData);
      
      if (isSecurityError) {
        // Log as security event
        const severity = this.determineSeverity(errorMessage, additionalData);
        
        securityMonitor.logSecurityEvent(
          'SECURITY_ERROR_DETECTED',
          {
            errorMessage,
            ...sanitizedContext
          },
          severity
        );
      }
      
      // Send to external service
      this.sendToExternalService(errorReport);
    } catch (internalError) {
      // Ensure error monitoring never throws errors itself
      console.error('Error monitoring failure:', internalError);
    }
  }

  /**
   * Log a security event through the error monitoring system
   */
  public logSecurityEvent(
    eventType: string,
    details: Record<string, unknown>,
    severity: SecurityEventSeverity = 'MEDIUM'
  ): void {
    securityMonitor.logSecurityEvent(eventType, details, severity);
  }

  /**
   * Get recent error reports
   */
  public getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errors.slice(0, Math.min(count, this.errors.length));
  }

  /**
   * Get recent security events
   */
  public async getRecentSecurityEvents(count: number = 10): Promise<Record<string, unknown>[]> {
    return securityMonitor.getRecentSecurityEvents({
      limit: count
    });
  }

  /**
   * Get high severity security events
   */
  public getHighSeverityEvents(): Record<string, unknown>[] {
    return securityMonitor.getHighSeverityEvents();
  }

  /**
   * Send error report to external monitoring service
   */
  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    try {
      // In a production environment, this would send the error to a service like Sentry, LogRocket, etc.
      // This is a placeholder implementation
      
      // Only send to external service in production
      if (import.meta.env?.MODE === 'production') {
        // Example implementation for external service
        /*
        await fetch('https://error-monitoring-service.example.com/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            ...errorReport,
            appVersion: APP_VERSION,
            projectId: PROJECT_ID
          })
        });
        */
        
        // Currently just logging to console in production
        console.error('Production Error:', {
          message: errorReport.message,
          timestamp: errorReport.timestamp,
          context: errorReport.context
        });
      }
    } catch (error) {
      // Silently fail if external service is unavailable
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  /**
   * Determine if an error is security-related
   */
  private isSecurityRelatedError(errorMessage: string, context: Record<string, unknown>): boolean {
    // Check error message for security-related keywords
    const securityKeywords = [
      'auth', 'token', 'password', 'credential', 'login', 'permission', 'access', 'forbidden',
      'unauthorized', 'csrf', 'xss', 'injection', 'security', 'hack', 'breach', 'attack'
    ];
    
    const messageContainsSecurityKeyword = securityKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
    
    // Check if the action is related to authentication
    const securityActions = [
      'signIn', 'signOut', 'signUp', 'login', 'logout', 'register', 'resetPassword',
      'updatePassword', 'getCurrentUser', 'validateToken', 'checkPermission', 'authorization'
    ];
    
    const actionIsSecurityRelated = context.action && 
      securityActions.some(action => 
        String(context.action).toLowerCase().includes(action.toLowerCase())
      );
    
    return messageContainsSecurityKeyword || actionIsSecurityRelated;
  }

  /**
   * Determine the severity of a security error
   */
  private determineSeverity(errorMessage: string, context: Record<string, unknown>): SecurityEventSeverity {
    // High severity indicators
    const highSeverityIndicators = [
      'invalid token', 'expired token', 'token validation failed', 'unauthorized',
      'permission denied', 'access denied', 'injection', 'xss', 'csrf', 'attack',
      'breach', 'admin', 'superuser', 'privilege', 'escalation'
    ];
    
    const isHighSeverity = highSeverityIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator)
    );
    
    // Critical severity indicators
    const criticalSeverityIndicators = [
      'multiple failed attempts', 'brute force', 'suspicious activity',
      'security breach', 'data leak', 'unauthorized admin access'
    ];
    
    const isCriticalSeverity = criticalSeverityIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator)
    );
    
    // Check if error is in a sensitive action
    const sensitiveActions = ['updatePassword', 'deleteAccount', 'grantPermission', 'adminAccess'];
    const isInSensitiveAction = context.action && 
      sensitiveActions.some(action => String(context.action) === action);
    
    if (isCriticalSeverity || (isHighSeverity && isInSensitiveAction)) {
      return 'CRITICAL';
    } else if (isHighSeverity || isInSensitiveAction) {
      return 'HIGH';
    } else {
      return 'MEDIUM';
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };
    
    // List of fields that should be redacted
    const sensitiveFields = [
      'password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey',
      'key', 'credential', 'credentials', 'auth', 'jwt', 'session'
    ];
    
    // Redact sensitive fields
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' && 
        sanitized[key] !== null && 
        !Array.isArray(sanitized[key])
      ) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key] as Record<string, unknown>);
      }
    });
    
    return sanitized;
  }
}

export const enhancedErrorMonitor = EnhancedErrorMonitor.getInstance();