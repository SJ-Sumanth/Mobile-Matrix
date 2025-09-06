import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor, APIPerformanceTracker, DatabasePerformanceTracker } from '../monitor.js';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
}));

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.clearMetrics();
  });

  afterEach(() => {
    monitor.disconnect();
  });

  describe('recordMetric', () => {
    it('should record a metric with name and value', () => {
      monitor.recordMetric('test-metric', 100);
      
      const metrics = monitor.getMetrics('test-metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].timestamp).toBeTypeOf('number');
    });

    it('should record a metric with metadata', () => {
      const metadata = { endpoint: '/api/test', method: 'GET' };
      monitor.recordMetric('api-call', 200, metadata);
      
      const metrics = monitor.getMetrics('api-call');
      expect(metrics[0].metadata).toEqual(metadata);
    });

    it('should limit metrics to 1000 entries', () => {
      // Record 1100 metrics
      for (let i = 0; i < 1100; i++) {
        monitor.recordMetric('test', i);
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1000);
      
      // Should keep the latest 1000 metrics
      expect(metrics[0].value).toBe(100); // First kept metric
      expect(metrics[999].value).toBe(1099); // Last metric
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      monitor.recordMetric('metric-a', 100);
      monitor.recordMetric('metric-b', 200);
      monitor.recordMetric('metric-a', 150);
    });

    it('should return all metrics when no name is provided', () => {
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('should return filtered metrics by name', () => {
      const metrics = monitor.getMetrics('metric-a');
      expect(metrics).toHaveLength(2);
      expect(metrics.every(m => m.name === 'metric-a')).toBe(true);
    });
  });

  describe('getMetricStats', () => {
    beforeEach(() => {
      // Record metrics with values: 100, 150, 200, 250, 300
      [100, 150, 200, 250, 300].forEach(value => {
        monitor.recordMetric('test-stats', value);
      });
    });

    it('should calculate correct statistics', () => {
      const stats = monitor.getMetricStats('test-stats');
      
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(5);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(300);
      expect(stats!.avg).toBe(200);
      expect(stats!.p95).toBe(300); // 95th percentile of 5 items is the last item
    });

    it('should return null for non-existent metric', () => {
      const stats = monitor.getMetricStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('setEnabled', () => {
    it('should not record metrics when disabled', () => {
      monitor.setEnabled(false);
      monitor.recordMetric('test', 100);
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should record metrics when enabled', () => {
      monitor.setEnabled(true);
      monitor.recordMetric('test', 100);
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
    });
  });
});

describe('APIPerformanceTracker', () => {
  let monitor: PerformanceMonitor;
  let tracker: APIPerformanceTracker;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    tracker = APIPerformanceTracker.getInstance(monitor);
    monitor.clearMetrics();
  });

  it('should track successful API calls', async () => {
    const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
    
    const result = await tracker.trackAPICall('/api/test', 'GET', mockApiCall);
    
    expect(result).toEqual({ data: 'test' });
    expect(mockApiCall).toHaveBeenCalledOnce();
    
    const metrics = monitor.getMetrics('api-call');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].metadata).toEqual({
      endpoint: '/api/test',
      method: 'GET',
      success: true,
    });
  });

  it('should track failed API calls', async () => {
    const error = new Error('API Error');
    const mockApiCall = vi.fn().mockRejectedValue(error);
    
    await expect(
      tracker.trackAPICall('/api/test', 'POST', mockApiCall)
    ).rejects.toThrow('API Error');
    
    const metrics = monitor.getMetrics('api-call');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].metadata).toEqual({
      endpoint: '/api/test',
      method: 'POST',
      success: false,
      error: 'API Error',
    });
  });

  it('should measure API call duration', async () => {
    const mockApiCall = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('done'), 100))
    );
    
    await tracker.trackAPICall('/api/slow', 'GET', mockApiCall);
    
    const metrics = monitor.getMetrics('api-call');
    expect(metrics[0].value).toBeGreaterThan(90); // Should be around 100ms
  });
});

describe('DatabasePerformanceTracker', () => {
  let monitor: PerformanceMonitor;
  let tracker: DatabasePerformanceTracker;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    tracker = DatabasePerformanceTracker.getInstance(monitor);
    monitor.clearMetrics();
  });

  it('should track successful database queries', async () => {
    const mockQuery = vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]);
    
    const result = await tracker.trackQuery('findUsers', mockQuery);
    
    expect(result).toEqual([{ id: 1, name: 'test' }]);
    expect(mockQuery).toHaveBeenCalledOnce();
    
    const metrics = monitor.getMetrics('database-query');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].metadata).toEqual({
      queryName: 'findUsers',
      success: true,
    });
  });

  it('should track failed database queries', async () => {
    const error = new Error('Database Error');
    const mockQuery = vi.fn().mockRejectedValue(error);
    
    await expect(
      tracker.trackQuery('findUsers', mockQuery)
    ).rejects.toThrow('Database Error');
    
    const metrics = monitor.getMetrics('database-query');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].metadata).toEqual({
      queryName: 'findUsers',
      success: false,
      error: 'Database Error',
    });
  });

  it('should measure query duration', async () => {
    const mockQuery = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([]), 50))
    );
    
    await tracker.trackQuery('slowQuery', mockQuery);
    
    const metrics = monitor.getMetrics('database-query');
    expect(metrics[0].value).toBeGreaterThan(40); // Should be around 50ms
  });
});

describe('Performance Integration Tests', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.clearMetrics();
  });

  it('should handle multiple concurrent performance tracking', async () => {
    const apiTracker = APIPerformanceTracker.getInstance(monitor);
    const dbTracker = DatabasePerformanceTracker.getInstance(monitor);

    const promises = [
      apiTracker.trackAPICall('/api/1', 'GET', () => 
        new Promise(resolve => setTimeout(() => resolve('api1'), 50))
      ),
      apiTracker.trackAPICall('/api/2', 'POST', () => 
        new Promise(resolve => setTimeout(() => resolve('api2'), 30))
      ),
      dbTracker.trackQuery('query1', () => 
        new Promise(resolve => setTimeout(() => resolve([]), 20))
      ),
      dbTracker.trackQuery('query2', () => 
        new Promise(resolve => setTimeout(() => resolve([]), 40))
      ),
    ];

    await Promise.all(promises);

    const apiMetrics = monitor.getMetrics('api-call');
    const dbMetrics = monitor.getMetrics('database-query');

    expect(apiMetrics).toHaveLength(2);
    expect(dbMetrics).toHaveLength(2);

    // Verify all calls were successful
    expect(apiMetrics.every(m => m.metadata?.success)).toBe(true);
    expect(dbMetrics.every(m => m.metadata?.success)).toBe(true);
  });

  it('should provide accurate performance statistics', async () => {
    // Record multiple metrics with known values
    const values = [100, 200, 300, 400, 500];
    values.forEach(value => {
      monitor.recordMetric('test-perf', value);
    });

    const stats = monitor.getMetricStats('test-perf');
    
    expect(stats).toEqual({
      count: 5,
      min: 100,
      max: 500,
      avg: 300,
      p95: 500,
    });
  });
});

// Performance benchmark tests
describe('Performance Benchmarks', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.clearMetrics();
  });

  it('should handle high-frequency metric recording', () => {
    const startTime = performance.now();
    
    // Record 10,000 metrics
    for (let i = 0; i < 10000; i++) {
      monitor.recordMetric('benchmark', i);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(1000); // 1 second
    
    const metrics = monitor.getMetrics('benchmark');
    expect(metrics).toHaveLength(1000); // Should be limited to 1000
  });

  it('should efficiently calculate statistics for large datasets', () => {
    // Record 1000 metrics
    for (let i = 0; i < 1000; i++) {
      monitor.recordMetric('large-dataset', Math.random() * 1000);
    }
    
    const startTime = performance.now();
    const stats = monitor.getMetricStats('large-dataset');
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    // Statistics calculation should be fast
    expect(duration).toBeLessThan(100); // 100ms
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1000);
  });
});