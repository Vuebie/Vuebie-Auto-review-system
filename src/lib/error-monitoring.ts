// Basic Error Monitoring Implementation
// For production, consider integrating with Sentry or similar services

export interface ErrorReport {
  timestamp: string;
  error: string;
  stack?: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: ErrorReport[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  public logError(error: Error | string, additionalData?: Record<string, unknown>): void {
    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: additionalData?.userId,
      sessionId: this.generateSessionId(),
      ...additionalData
    };

    // Add to memory storage
    this.errors.unshift(errorReport);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error Monitor:', errorReport);
    }

    // In production, you could send to external service
    this.sendToExternalService(errorReport);
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    // Placeholder for external error reporting service
    // In production, implement actual error reporting service integration
    try {
      if (import.meta.env.MODE === 'production') {
        // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
      }
    } catch (sendError) {
      console.warn('Failed to send error report to external service:', sendError);
    }
  }

  public getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errors.slice(0, count);
  }

  public clearErrors(): void {
    this.errors = [];
  }
}

export const errorMonitor = ErrorMonitor.getInstance();

// Global error handler
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorMonitor.logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledrejection' }
    );
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorMonitor.logError(
      event.error || new Error(event.message),
      { 
        type: 'uncaughtError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });
};