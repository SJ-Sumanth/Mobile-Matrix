'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../../lib/serviceWorker.js';
import { performanceMonitor, preloadCriticalComponents } from '../../utils/dynamicImports.js';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

/**
 * Performance provider that initializes service worker and performance monitoring
 */
export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Register service worker
    initializeServiceWorker();
    
    // Preload critical components
    preloadCriticalComponents();
    
    // Setup performance observers
    setupPerformanceObservers();
    
  }, []);

  return <>{children}</>;
}

/**
 * Initialize performance monitoring
 */
function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Record initial page load metrics
  performanceMonitor.recordMetric('page-load-start', performance.now(), {
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  // Monitor page visibility changes
  document.addEventListener('visibilitychange', () => {
    performanceMonitor.recordMetric('visibility-change', performance.now(), {
      hidden: document.hidden,
    });
  });

  // Monitor network status changes
  window.addEventListener('online', () => {
    performanceMonitor.recordMetric('network-status', performance.now(), {
      online: true,
    });
  });

  window.addEventListener('offline', () => {
    performanceMonitor.recordMetric('network-status', performance.now(), {
      online: false,
    });
  });

  // Monitor page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.recordMetric('page-unload', performance.now(), {
      url: window.location.href,
    });
  });
}

/**
 * Initialize service worker
 */
function initializeServiceWorker() {
  if (typeof window === 'undefined') return;

  registerServiceWorker({
    onSuccess: (registration) => {
      console.log('Service Worker registered successfully');
      performanceMonitor.recordMetric('service-worker-registered', performance.now(), {
        scope: registration.scope,
      });
    },
    onUpdate: (registration) => {
      console.log('Service Worker updated');
      performanceMonitor.recordMetric('service-worker-updated', performance.now());
      
      // Optionally show update notification to user
      if (confirm('A new version is available. Reload to update?')) {
        window.location.reload();
      }
    },
    onError: (error) => {
      console.error('Service Worker registration failed:', error);
      performanceMonitor.recordMetric('service-worker-error', performance.now(), {
        error: error.message,
      });
    },
  });
}

/**
 * Setup additional performance observers
 */
function setupPerformanceObservers() {
  if (typeof window === 'undefined') return;

  // Monitor memory usage (if available)
  if ('memory' in performance) {
    const checkMemory = () => {
      const memory = (performance as any).memory;
      performanceMonitor.recordMetric('memory-usage', memory.usedJSHeapSize, {
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    };

    // Check memory usage every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  // Monitor connection quality (if available)
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    const recordConnection = () => {
      performanceMonitor.recordMetric('connection-quality', performance.now(), {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    };

    connection.addEventListener('change', recordConnection);
    recordConnection(); // Initial check
  }

  // Monitor device orientation changes
  window.addEventListener('orientationchange', () => {
    performanceMonitor.recordMetric('orientation-change', performance.now(), {
      orientation: window.orientation,
    });
  });

  // Monitor resize events (throttled)
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      performanceMonitor.recordMetric('window-resize', performance.now(), {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 250);
  });
}

/**
 * Performance debugging component (development only)
 */
export function PerformanceDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Add performance debugging tools
    (window as any).__PERFORMANCE_MONITOR__ = performanceMonitor;
    
    // Add keyboard shortcut to show performance stats
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        const stats = performanceMonitor.getMetrics();
        console.group('Performance Stats');
        console.table(stats.slice(-20)); // Show last 20 metrics
        console.groupEnd();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      Performance Monitor Active
      <br />
      <small>Ctrl+Shift+P for stats</small>
    </div>
  );
}