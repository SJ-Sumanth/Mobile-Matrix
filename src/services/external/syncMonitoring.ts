import { z } from 'zod';

// Monitoring event types
export type MonitoringEventType = 
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'api_request'
  | 'api_error'
  | 'data_validation_error'
  | 'rate_limit_hit'
  | 'fallback_activated';

// Monitoring event schema
const MonitoringEventSchema = z.object({
  id: z.string(),
  type: z.enum(['sync_started', 'sync_completed', 'sync_failed', 'api_request', 'api_error', 'data_validation_error', 'rate_limit_hit', 'fallback_activated']),
  source: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
  error: z.string().optional(),
  duration: z.number().optional(), // in milliseconds
});

export type MonitoringEvent = z.infer<typeof MonitoringEventSchema>;

// Sync metrics
export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  lastSyncTime: Date | null;
  apiRequestsCount: number;
  apiErrorsCount: number;
  rateLimitHits: number;
  fallbackActivations: number;
}

// Alert configuration
export interface AlertConfig {
  enabled: boolean;
  errorThreshold: number; // Number of errors before alerting
  rateLimitThreshold: number; // Number of rate limit hits before alerting
  syncFailureThreshold: number; // Number of consecutive failures before alerting
  webhookUrl?: string;
  emailRecipients?: string[];
}

export class SyncMonitoringService {
  private events: MonitoringEvent[] = [];
  private metrics: SyncMetrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageDuration: 0,
    lastSyncTime: null,
    apiRequestsCount: 0,
    apiErrorsCount: 0,
    rateLimitHits: 0,
    fallbackActivations: 0,
  };
  private alertConfig: AlertConfig;
  private consecutiveFailures = 0;

  constructor(alertConfig: AlertConfig) {
    this.alertConfig = alertConfig;
  }

  /**
   * Log a monitoring event
   */
  logEvent(
    type: MonitoringEventType,
    source: string,
    metadata?: Record<string, any>,
    error?: string,
    duration?: number
  ): void {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      type,
      source,
      timestamp: new Date(),
      metadata,
      error,
      duration,
    };

    this.events.push(event);
    this.updateMetrics(event);
    this.checkAlerts(event);

    // Log to console for development
    this.logToConsole(event);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Log sync start event
   */
  logSyncStart(source: string, metadata?: Record<string, any>): void {
    this.logEvent('sync_started', source, metadata);
  }

  /**
   * Log sync completion event
   */
  logSyncComplete(source: string, duration: number, metadata?: Record<string, any>): void {
    this.logEvent('sync_completed', source, metadata, undefined, duration);
    this.consecutiveFailures = 0; // Reset failure counter on success
  }

  /**
   * Log sync failure event
   */
  logSyncFailure(source: string, error: string, duration?: number, metadata?: Record<string, any>): void {
    this.logEvent('sync_failed', source, metadata, error, duration);
    this.consecutiveFailures++;
  }

  /**
   * Log API request event
   */
  logApiRequest(source: string, endpoint: string, responseTime: number, statusCode?: number): void {
    this.logEvent('api_request', source, {
      endpoint,
      responseTime,
      statusCode,
    });
  }

  /**
   * Log API error event
   */
  logApiError(source: string, endpoint: string, error: string, statusCode?: number): void {
    this.logEvent('api_error', source, {
      endpoint,
      statusCode,
    }, error);
  }

  /**
   * Log data validation error
   */
  logValidationError(source: string, error: string, data?: any): void {
    this.logEvent('data_validation_error', source, {
      dataType: typeof data,
      hasData: !!data,
    }, error);
  }

  /**
   * Log rate limit hit
   */
  logRateLimitHit(source: string, endpoint: string, retryAfter?: number): void {
    this.logEvent('rate_limit_hit', source, {
      endpoint,
      retryAfter,
    });
  }

  /**
   * Log fallback activation
   */
  logFallbackActivation(source: string, reason: string, fallbackType: string): void {
    this.logEvent('fallback_activated', source, {
      reason,
      fallbackType,
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Get events by type and time range
   */
  getEvents(
    type?: MonitoringEventType,
    source?: string,
    startTime?: Date,
    endTime?: Date
  ): MonitoringEvent[] {
    let filteredEvents = this.events;

    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    if (source) {
      filteredEvents = filteredEvents.filter(event => event.source === source);
    }

    if (startTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= startTime);
    }

    if (endTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= endTime);
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get error summary for the last N hours
   */
  getErrorSummary(hours = 24): {
    totalErrors: number;
    errorsBySource: Record<string, number>;
    errorsByType: Record<string, number>;
    recentErrors: MonitoringEvent[];
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const errorEvents = this.getEvents(undefined, undefined, cutoffTime).filter(
      event => event.type.includes('error') || event.type === 'sync_failed'
    );

    const errorsBySource: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    errorEvents.forEach(event => {
      errorsBySource[event.source] = (errorsBySource[event.source] || 0) + 1;
      errorsByType[event.type] = (errorsByType[event.type] || 0) + 1;
    });

    return {
      totalErrors: errorEvents.length,
      errorsBySource,
      errorsByType,
      recentErrors: errorEvents.slice(0, 10), // Last 10 errors
    };
  }

  /**
   * Get performance metrics for API calls
   */
  getApiPerformanceMetrics(hours = 24): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsBySource: Record<string, number>;
    slowestRequests: MonitoringEvent[];
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const apiEvents = this.getEvents('api_request', undefined, cutoffTime);
    const apiErrors = this.getEvents('api_error', undefined, cutoffTime);

    const requestsBySource: Record<string, number> = {};
    let totalResponseTime = 0;

    apiEvents.forEach(event => {
      requestsBySource[event.source] = (requestsBySource[event.source] || 0) + 1;
      if (event.metadata?.responseTime) {
        totalResponseTime += event.metadata.responseTime;
      }
    });

    const averageResponseTime = apiEvents.length > 0 ? totalResponseTime / apiEvents.length : 0;
    const errorRate = apiEvents.length > 0 ? (apiErrors.length / apiEvents.length) * 100 : 0;

    // Get slowest requests (top 10)
    const slowestRequests = apiEvents
      .filter(event => event.metadata?.responseTime)
      .sort((a, b) => (b.metadata?.responseTime || 0) - (a.metadata?.responseTime || 0))
      .slice(0, 10);

    return {
      totalRequests: apiEvents.length,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsBySource,
      slowestRequests,
    };
  }

  /**
   * Generate health report
   */
  generateHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    summary: string;
    metrics: SyncMetrics;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check consecutive failures
    if (this.consecutiveFailures >= 3) {
      status = 'critical';
      issues.push(`${this.consecutiveFailures} consecutive sync failures detected`);
      recommendations.push('Check external API connectivity and credentials');
    } else if (this.consecutiveFailures >= 1) {
      status = 'warning';
      issues.push(`${this.consecutiveFailures} recent sync failures`);
    }

    // Check error rate
    const errorSummary = this.getErrorSummary(24);
    if (errorSummary.totalErrors > 50) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High error rate: ${errorSummary.totalErrors} errors in last 24 hours`);
      recommendations.push('Review error logs and consider implementing additional fallbacks');
    }

    // Check API performance
    const apiMetrics = this.getApiPerformanceMetrics(24);
    if (apiMetrics.errorRate > 10) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High API error rate: ${apiMetrics.errorRate}%`);
      recommendations.push('Check external API status and implement circuit breaker pattern');
    }

    if (apiMetrics.averageResponseTime > 5000) {
      if (status === 'healthy') status = 'warning';
      issues.push(`Slow API responses: ${apiMetrics.averageResponseTime}ms average`);
      recommendations.push('Consider implementing request timeouts and caching');
    }

    // Check rate limiting
    if (this.metrics.rateLimitHits > 10) {
      if (status === 'healthy') status = 'warning';
      issues.push(`Frequent rate limiting: ${this.metrics.rateLimitHits} hits`);
      recommendations.push('Implement better rate limiting and request queuing');
    }

    let summary = 'All systems operating normally';
    if (status === 'warning') {
      summary = 'Some issues detected, monitoring recommended';
    } else if (status === 'critical') {
      summary = 'Critical issues detected, immediate attention required';
    }

    return {
      status,
      summary,
      metrics: this.metrics,
      issues,
      recommendations,
    };
  }

  /**
   * Clear old events and reset metrics
   */
  clearOldData(olderThanHours = 168): void { // Default: 7 days
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    
    // Recalculate metrics based on remaining events
    this.recalculateMetrics();
  }

  /**
   * Update metrics based on new event
   */
  private updateMetrics(event: MonitoringEvent): void {
    switch (event.type) {
      case 'sync_started':
        this.metrics.totalSyncs++;
        break;
      
      case 'sync_completed':
        this.metrics.successfulSyncs++;
        this.metrics.lastSyncTime = event.timestamp;
        if (event.duration) {
          this.updateAverageDuration(event.duration);
        }
        break;
      
      case 'sync_failed':
        this.metrics.failedSyncs++;
        break;
      
      case 'api_request':
        this.metrics.apiRequestsCount++;
        break;
      
      case 'api_error':
        this.metrics.apiErrorsCount++;
        break;
      
      case 'rate_limit_hit':
        this.metrics.rateLimitHits++;
        break;
      
      case 'fallback_activated':
        this.metrics.fallbackActivations++;
        break;
    }
  }

  /**
   * Update average duration calculation
   */
  private updateAverageDuration(newDuration: number): void {
    if (this.metrics.successfulSyncs === 1) {
      this.metrics.averageDuration = newDuration;
    } else {
      // Calculate running average
      const totalDuration = this.metrics.averageDuration * (this.metrics.successfulSyncs - 1) + newDuration;
      this.metrics.averageDuration = totalDuration / this.metrics.successfulSyncs;
    }
  }

  /**
   * Recalculate metrics from existing events
   */
  private recalculateMetrics(): void {
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageDuration: 0,
      lastSyncTime: null,
      apiRequestsCount: 0,
      apiErrorsCount: 0,
      rateLimitHits: 0,
      fallbackActivations: 0,
    };

    let totalDuration = 0;
    
    this.events.forEach(event => {
      this.updateMetrics(event);
      if (event.type === 'sync_completed' && event.duration) {
        totalDuration += event.duration;
      }
    });

    if (this.metrics.successfulSyncs > 0) {
      this.metrics.averageDuration = totalDuration / this.metrics.successfulSyncs;
    }
  }

  /**
   * Check if alerts should be triggered
   */
  private checkAlerts(event: MonitoringEvent): void {
    if (!this.alertConfig.enabled) return;

    let shouldAlert = false;
    let alertMessage = '';

    // Check error threshold
    if (event.type.includes('error') || event.type === 'sync_failed') {
      const recentErrors = this.getErrorSummary(1).totalErrors;
      if (recentErrors >= this.alertConfig.errorThreshold) {
        shouldAlert = true;
        alertMessage = `Error threshold exceeded: ${recentErrors} errors in the last hour`;
      }
    }

    // Check consecutive failures
    if (event.type === 'sync_failed' && this.consecutiveFailures >= this.alertConfig.syncFailureThreshold) {
      shouldAlert = true;
      alertMessage = `Sync failure threshold exceeded: ${this.consecutiveFailures} consecutive failures`;
    }

    // Check rate limit threshold
    if (event.type === 'rate_limit_hit' && this.metrics.rateLimitHits >= this.alertConfig.rateLimitThreshold) {
      shouldAlert = true;
      alertMessage = `Rate limit threshold exceeded: ${this.metrics.rateLimitHits} hits`;
    }

    if (shouldAlert) {
      this.sendAlert(alertMessage, event);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(message: string, event: MonitoringEvent): Promise<void> {
    console.error(`🚨 ALERT: ${message}`, event);

    // Send webhook notification if configured
    if (this.alertConfig.webhookUrl) {
      try {
        await fetch(this.alertConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            event,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }

    // TODO: Implement email notifications if configured
    // This would require an email service integration
  }

  /**
   * Log event to console with appropriate formatting
   */
  private logToConsole(event: MonitoringEvent): void {
    const timestamp = event.timestamp.toISOString();
    const prefix = `[${timestamp}] [${event.source}]`;

    switch (event.type) {
      case 'sync_started':
        console.log(`${prefix} 🔄 Sync started`);
        break;
      
      case 'sync_completed':
        console.log(`${prefix} ✅ Sync completed in ${event.duration}ms`);
        break;
      
      case 'sync_failed':
        console.error(`${prefix} ❌ Sync failed: ${event.error}`);
        break;
      
      case 'api_request':
        console.log(`${prefix} 📡 API request to ${event.metadata?.endpoint} (${event.metadata?.responseTime}ms)`);
        break;
      
      case 'api_error':
        console.error(`${prefix} 🚫 API error on ${event.metadata?.endpoint}: ${event.error}`);
        break;
      
      case 'data_validation_error':
        console.warn(`${prefix} ⚠️ Data validation error: ${event.error}`);
        break;
      
      case 'rate_limit_hit':
        console.warn(`${prefix} 🐌 Rate limit hit on ${event.metadata?.endpoint}`);
        break;
      
      case 'fallback_activated':
        console.warn(`${prefix} 🔄 Fallback activated: ${event.metadata?.reason}`);
        break;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}