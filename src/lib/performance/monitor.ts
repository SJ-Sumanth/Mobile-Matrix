/**
 * Performance monitoring and analytics for MobileMatrix
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.trackWebVitals();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.recordResourceMetrics(entry as PerformanceResourceTiming);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // Long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name,
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  /**
   * Track Web Vitals metrics
   */
  private trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.onWebVital.bind(this));
      getFID(this.onWebVital.bind(this));
      getFCP(this.onWebVital.bind(this));
      getLCP(this.onWebVital.bind(this));
      getTTFB(this.onWebVital.bind(this));
    }).catch((error) => {
      console.warn('Web Vitals not available:', error);
    });
  }

  /**
   * Handle Web Vitals metric
   */
  private onWebVital(metric: WebVitalsMetric): void {
    this.recordMetric(`web-vital-${metric.name.toLowerCase()}`, metric.value, {
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });

    // Send to analytics if configured
    this.sendToAnalytics(metric);
  }

  /**
   * Record navigation metrics
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics = {
      'dns-lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'tcp-connect': entry.connectEnd - entry.connectStart,
      'ssl-handshake': entry.connectEnd - entry.secureConnectionStart,
      'ttfb': entry.responseStart - entry.requestStart,
      'response-time': entry.responseEnd - entry.responseStart,
      'dom-parse': entry.domContentLoadedEventStart - entry.responseEnd,
      'dom-ready': entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      'load-complete': entry.loadEventEnd - entry.loadEventStart,
      'total-load-time': entry.loadEventEnd - entry.navigationStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.recordMetric(name, value);
      }
    });
  }

  /**
   * Record resource metrics
   */
  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    const loadTime = entry.responseEnd - entry.startTime;

    this.recordMetric(`resource-load-${resourceType}`, loadTime, {
      url: entry.name,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    });

    // Track slow resources
    if (loadTime > 1000) {
      this.recordMetric('slow-resource', loadTime, {
        url: entry.name,
        type: resourceType,
      });
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      console.log(`Performance: ${name} = ${value}ms`, metadata);
    }
  }

  /**
   * Check if metric is significant enough to log
   */
  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'ttfb': 200,
      'total-load-time': 3000,
      'long-task': 50,
      'slow-resource': 1000,
      'api-call': 1000,
      'database-query': 100,
    };

    return value > (thresholds[name] || 1000);
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const min = values[0];
    const max = values[count - 1];
    const avg = values.reduce((sum, val) => sum + val, 0) / count;
    const p95Index = Math.floor(count * 0.95);
    const p95 = values[p95Index];

    return { count, min, max, avg, p95 };
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: WebVitalsMetric): void {
    // This would integrate with your analytics service
    // Example: Google Analytics, DataDog, New Relic, etc.
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        custom_parameter_1: metric.id,
        custom_parameter_2: metric.navigationType,
      });
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * API call performance tracker
 */
export class APIPerformanceTracker {
  private static instance: APIPerformanceTracker;
  private monitor: PerformanceMonitor;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
  }

  static getInstance(monitor: PerformanceMonitor): APIPerformanceTracker {
    if (!APIPerformanceTracker.instance) {
      APIPerformanceTracker.instance = new APIPerformanceTracker(monitor);
    }
    return APIPerformanceTracker.instance;
  }

  /**
   * Track API call performance
   */
  async trackAPICall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      this.monitor.recordMetric('api-call', duration, {
        endpoint,
        method,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.monitor.recordMetric('api-call', duration, {
        endpoint,
        method,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * Database query performance tracker
 */
export class DatabasePerformanceTracker {
  private static instance: DatabasePerformanceTracker;
  private monitor: PerformanceMonitor;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
  }

  static getInstance(monitor: PerformanceMonitor): DatabasePerformanceTracker {
    if (!DatabasePerformanceTracker.instance) {
      DatabasePerformanceTracker.instance = new DatabasePerformanceTracker(monitor);
    }
    return DatabasePerformanceTracker.instance;
  }

  /**
   * Track database query performance
   */
  async trackQuery<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await query();
      const duration = performance.now() - startTime;
      this.monitor.recordMetric('database-query', duration, {
        queryName,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.monitor.recordMetric('database-query', duration, {
        queryName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitor() {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getMetricStats: performanceMonitor.getMetricStats.bind(performanceMonitor),
  };
}

/**
 * Component performance tracker
 */
export function trackComponentPerformance(componentName: string) {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const TrackedComponent = (props: any) => {
      const startTime = performance.now();
      
      React.useEffect(() => {
        const endTime = performance.now();
        performanceMonitor.recordMetric('component-render', endTime - startTime, {
          componentName,
        });
      });

      return React.createElement(Component, props);
    };

    TrackedComponent.displayName = `Tracked(${Component.displayName || Component.name})`;
    
    return TrackedComponent as T;
  };
}

// Import React for the component tracker
import React from 'react';