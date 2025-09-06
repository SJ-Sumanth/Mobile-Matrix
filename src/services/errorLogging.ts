import { ErrorLogEntry, ErrorContext, ErrorCode, AppError } from '@/types/errors';

/**
 * Error logging and monitoring service
 */
export class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private errorQueue: ErrorLogEntry[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startFlushTimer();
    
    // Handle page unload to flush remaining errors
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  /**
   * Log an error with context
   */
  async logError(
    error: Error | AppError,
    context: Partial<ErrorContext> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const errorEntry: ErrorLogEntry = {
        id: this.generateErrorId(),
        error: {
          name: error.name,
          message: error.message,
          code: error instanceof AppError ? error.code : undefined,
          stack: error.stack,
          statusCode: error instanceof AppError ? error.statusCode : undefined,
        },
        context: {
          timestamp: new Date(),
          userId: this.getUserId(),
          sessionId: this.getSessionId(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
          ...context,
        },
        severity,
        resolved: false,
        createdAt: new Date(),
      };

      // Add to queue
      this.errorQueue.push(errorEntry);

      // Flush immediately for critical errors
      if (severity === 'critical') {
        await this.flush();
      }

      // Flush if queue is getting full
      if (this.errorQueue.length >= this.maxQueueSize) {
        await this.flush();
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', errorEntry);
      }
    } catch (loggingError) {
      // Fallback logging to console if our logging fails
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', error);
    }
  }

  /**
   * Log multiple errors at once
   */
  async logErrors(errors: Array<{
    error: Error | AppError;
    context?: Partial<ErrorContext>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }>): Promise<void> {
    for (const { error, context, severity } of errors) {
      await this.logError(error, context, severity);
    }
  }

  /**
   * Flush error queue to external service
   */
  async flush(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to external logging service
      await this.sendToLoggingService(errorsToSend);
    } catch (error) {
      // If sending fails, put errors back in queue
      this.errorQueue.unshift(...errorsToSend);
      console.error('Failed to send errors to logging service:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send errors to external logging service
   */
  private async sendToLoggingService(errors: ErrorLogEntry[]): Promise<void> {
    // In a real application, you would send to services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
    // - Custom logging endpoint

    try {
      // Example: Send to custom logging endpoint
      const response = await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });

      if (!response.ok) {
        throw new Error(`Logging service responded with status: ${response.status}`);
      }
    } catch (error) {
      // If custom endpoint fails, try alternative methods
      await this.fallbackLogging(errors);
    }
  }

  /**
   * Fallback logging methods
   */
  private async fallbackLogging(errors: ErrorLogEntry[]): Promise<void> {
    // Store in localStorage as fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const existingErrors = JSON.parse(
          localStorage.getItem('error_logs') || '[]'
        );
        const updatedErrors = [...existingErrors, ...errors].slice(-50); // Keep last 50 errors
        localStorage.setItem('error_logs', JSON.stringify(updatedErrors));
      } catch (storageError) {
        console.error('Failed to store errors in localStorage:', storageError);
      }
    }

    // Send to console as last resort
    console.error('Error logging fallback - errors:', errors);
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop the flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID from session/auth
   */
  private getUserId(): string | undefined {
    // Implement based on your auth system
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || undefined;
    }
    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string | undefined {
    // Implement based on your session management
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return undefined;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    queueSize: number;
    isProcessing: boolean;
    recentErrors: ErrorLogEntry[];
  } {
    return {
      queueSize: this.errorQueue.length,
      isProcessing: this.isProcessing,
      recentErrors: this.errorQueue.slice(-10), // Last 10 errors
    };
  }

  /**
   * Clear error queue (for testing)
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush();
  }
}

// Singleton instance
export const errorLogger = ErrorLoggingService.getInstance();

// Convenience functions
export const logError = (
  error: Error | AppError,
  context?: Partial<ErrorContext>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
) => errorLogger.logError(error, context, severity);

export const logCriticalError = (
  error: Error | AppError,
  context?: Partial<ErrorContext>
) => errorLogger.logError(error, context, 'critical');

export const logWarning = (
  message: string,
  context?: Partial<ErrorContext>
) => errorLogger.logError(new Error(message), context, 'low');

// Error boundary integration
export const logErrorBoundaryError = (
  error: Error,
  errorInfo: React.ErrorInfo,
  componentName?: string
) => {
  errorLogger.logError(error, {
    component: componentName,
    errorInfo: errorInfo.componentStack,
  }, 'high');
};

// Unhandled error listeners
if (typeof window !== 'undefined') {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      {
        type: 'unhandledrejection',
        reason: event.reason,
      },
      'high'
    );
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    errorLogger.logError(
      event.error || new Error(event.message),
      {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      'high'
    );
  });
}