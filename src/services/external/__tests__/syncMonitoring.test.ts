import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncMonitoringService } from '../syncMonitoring.js';

describe('SyncMonitoringService', () => {
  let monitoringService: SyncMonitoringService;

  const mockAlertConfig = {
    enabled: true,
    errorThreshold: 5,
    rateLimitThreshold: 3,
    syncFailureThreshold: 2,
    webhookUrl: 'https://example.com/webhook',
    emailRecipients: ['admin@example.com'],
  };

  beforeEach(() => {
    monitoringService = new SyncMonitoringService(mockAlertConfig);
    vi.clearAllMocks();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logEvent', () => {
    it('should log events correctly', () => {
      monitoringService.logEvent('sync_started', 'test_source', { test: 'data' });

      const events = monitoringService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'sync_started',
        source: 'test_source',
        metadata: { test: 'data' },
      });
    });

    it('should update metrics when logging events', () => {
      monitoringService.logEvent('sync_started', 'test_source');
      monitoringService.logEvent('sync_completed', 'test_source', undefined, undefined, 1000);
      monitoringService.logEvent('api_request', 'test_source');
      monitoringService.logEvent('api_error', 'test_source', undefined, 'Test error');

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalSyncs).toBe(1);
      expect(metrics.successfulSyncs).toBe(1);
      expect(metrics.failedSyncs).toBe(0);
      expect(metrics.apiRequestsCount).toBe(1);
      expect(metrics.apiErrorsCount).toBe(1);
      expect(metrics.averageDuration).toBe(1000);
    });

    it('should limit events to 1000 in memory', () => {
      // Add 1100 events
      for (let i = 0; i < 1100; i++) {
        monitoringService.logEvent('api_request', 'test_source');
      }

      const events = monitoringService.getEvents();
      expect(events).toHaveLength(1000);
    });
  });

  describe('sync event logging', () => {
    it('should log sync start events', () => {
      monitoringService.logSyncStart('test_source', { phoneId: 'test-phone' });

      const events = monitoringService.getEvents('sync_started');
      expect(events).toHaveLength(1);
      expect(events[0].metadata).toEqual({ phoneId: 'test-phone' });
    });

    it('should log sync completion events', () => {
      monitoringService.logSyncComplete('test_source', 2000, { recordsProcessed: 10 });

      const events = monitoringService.getEvents('sync_completed');
      expect(events).toHaveLength(1);
      expect(events[0].duration).toBe(2000);
      expect(events[0].metadata).toEqual({ recordsProcessed: 10 });
    });

    it('should log sync failure events and track consecutive failures', () => {
      monitoringService.logSyncFailure('test_source', 'Test error', 1500);
      monitoringService.logSyncFailure('test_source', 'Another error', 1200);

      const events = monitoringService.getEvents('sync_failed');
      expect(events).toHaveLength(2);
      expect(events[0].error).toBe('Another error');
      expect(events[1].error).toBe('Test error');
    });

    it('should reset consecutive failures on success', () => {
      monitoringService.logSyncFailure('test_source', 'Error 1');
      monitoringService.logSyncFailure('test_source', 'Error 2');
      monitoringService.logSyncComplete('test_source', 1000);

      // Consecutive failures should be reset (this is internal state, 
      // but we can test it through health report)
      const health = monitoringService.generateHealthReport();
      expect(health.status).not.toBe('critical');
    });
  });

  describe('API event logging', () => {
    it('should log API requests', () => {
      monitoringService.logApiRequest('gsmarena', '/search', 500, 200);

      const events = monitoringService.getEvents('api_request');
      expect(events).toHaveLength(1);
      expect(events[0].metadata).toEqual({
        endpoint: '/search',
        responseTime: 500,
        statusCode: 200,
      });
    });

    it('should log API errors', () => {
      monitoringService.logApiError('gsmarena', '/search', 'Connection timeout', 500);

      const events = monitoringService.getEvents('api_error');
      expect(events).toHaveLength(1);
      expect(events[0].error).toBe('Connection timeout');
      expect(events[0].metadata?.statusCode).toBe(500);
    });

    it('should log rate limit hits', () => {
      monitoringService.logRateLimitHit('gsmarena', '/search', 60);

      const events = monitoringService.getEvents('rate_limit_hit');
      expect(events).toHaveLength(1);
      expect(events[0].metadata).toEqual({
        endpoint: '/search',
        retryAfter: 60,
      });
    });
  });

  describe('getEvents filtering', () => {
    beforeEach(() => {
      // Add various events
      monitoringService.logEvent('sync_started', 'source1');
      monitoringService.logEvent('sync_completed', 'source1');
      monitoringService.logEvent('api_request', 'source2');
      monitoringService.logEvent('api_error', 'source2');
    });

    it('should filter events by type', () => {
      const syncEvents = monitoringService.getEvents('sync_started');
      expect(syncEvents).toHaveLength(1);
      expect(syncEvents[0].type).toBe('sync_started');
    });

    it('should filter events by source', () => {
      const source1Events = monitoringService.getEvents(undefined, 'source1');
      expect(source1Events).toHaveLength(2);
      expect(source1Events.every(e => e.source === 'source1')).toBe(true);
    });

    it('should filter events by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentEvents = monitoringService.getEvents(undefined, undefined, oneHourAgo);
      expect(recentEvents.length).toBeGreaterThan(0);
      expect(recentEvents.every(e => e.timestamp >= oneHourAgo)).toBe(true);
    });
  });

  describe('getErrorSummary', () => {
    it('should summarize errors correctly', () => {
      monitoringService.logEvent('api_error', 'gsmarena', undefined, 'Error 1');
      monitoringService.logEvent('sync_failed', 'price_tracking', undefined, 'Error 2');
      monitoringService.logEvent('data_validation_error', 'gsmarena', undefined, 'Error 3');

      const summary = monitoringService.getErrorSummary(24);

      expect(summary.totalErrors).toBe(3);
      expect(summary.errorsBySource).toEqual({
        gsmarena: 2,
        price_tracking: 1,
      });
      expect(summary.errorsByType).toEqual({
        api_error: 1,
        sync_failed: 1,
        data_validation_error: 1,
      });
      expect(summary.recentErrors).toHaveLength(3);
    });
  });

  describe('getApiPerformanceMetrics', () => {
    it('should calculate API performance metrics', () => {
      monitoringService.logApiRequest('gsmarena', '/search', 500, 200);
      monitoringService.logApiRequest('gsmarena', '/phones', 300, 200);
      monitoringService.logApiRequest('price_tracking', '/prices', 800, 200);
      monitoringService.logApiError('gsmarena', '/search', 'Timeout', 500);

      const metrics = monitoringService.getApiPerformanceMetrics(24);

      expect(metrics.totalRequests).toBe(3);
      expect(metrics.averageResponseTime).toBe(533); // (500 + 300 + 800) / 3
      expect(metrics.errorRate).toBe(33.33); // 1 error out of 3 requests = 33.33%
      expect(metrics.requestsBySource).toEqual({
        gsmarena: 2,
        price_tracking: 1,
      });
      expect(metrics.slowestRequests).toHaveLength(3);
      expect(metrics.slowestRequests[0].metadata?.responseTime).toBe(800);
    });
  });

  describe('generateHealthReport', () => {
    it('should generate healthy status when no issues', () => {
      monitoringService.logSyncComplete('test_source', 1000);

      const health = monitoringService.generateHealthReport();

      expect(health.status).toBe('healthy');
      expect(health.summary).toBe('All systems operating normally');
      expect(health.issues).toHaveLength(0);
      expect(health.recommendations).toHaveLength(0);
    });

    it('should detect critical status with consecutive failures', () => {
      // Log 3 consecutive failures
      monitoringService.logSyncFailure('test_source', 'Error 1');
      monitoringService.logSyncFailure('test_source', 'Error 2');
      monitoringService.logSyncFailure('test_source', 'Error 3');

      const health = monitoringService.generateHealthReport();

      expect(health.status).toBe('critical');
      expect(health.summary).toBe('Critical issues detected, immediate attention required');
      expect(health.issues.some(issue => issue.includes('consecutive sync failures'))).toBe(true);
    });

    it('should detect warning status with high error rate', () => {
      // Add many errors
      for (let i = 0; i < 60; i++) {
        monitoringService.logEvent('api_error', 'test_source', undefined, `Error ${i}`);
      }

      const health = monitoringService.generateHealthReport();

      expect(health.status).toBe('warning');
      expect(health.issues.some(issue => issue.includes('High error rate'))).toBe(true);
    });

    it('should detect slow API responses', () => {
      // Add slow API requests
      for (let i = 0; i < 5; i++) {
        monitoringService.logApiRequest('test_source', '/test', 6000, 200); // 6 seconds
      }

      const health = monitoringService.generateHealthReport();

      expect(health.status).toBe('warning');
      expect(health.issues.some(issue => issue.includes('Slow API responses'))).toBe(true);
    });
  });

  describe('clearOldData', () => {
    it('should clear old events', () => {
      // Add some events
      monitoringService.logEvent('sync_started', 'test_source');
      monitoringService.logEvent('sync_completed', 'test_source');

      expect(monitoringService.getEvents()).toHaveLength(2);

      // Clear data older than 0 hours (should clear everything)
      monitoringService.clearOldData(0);

      expect(monitoringService.getEvents()).toHaveLength(0);
    });

    it('should recalculate metrics after clearing data', () => {
      monitoringService.logSyncComplete('test_source', 1000);
      
      let metrics = monitoringService.getMetrics();
      expect(metrics.successfulSyncs).toBe(1);

      monitoringService.clearOldData(0);

      metrics = monitoringService.getMetrics();
      expect(metrics.successfulSyncs).toBe(0);
    });
  });

  describe('alerting', () => {
    beforeEach(() => {
      // Mock fetch for webhook alerts
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
    });

    it('should trigger alerts when error threshold is exceeded', async () => {
      // Add errors to exceed threshold (5)
      for (let i = 0; i < 6; i++) {
        monitoringService.logEvent('api_error', 'test_source', undefined, `Error ${i}`);
      }

      // Wait a bit for async alert processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(global.fetch).toHaveBeenCalledWith(
        mockAlertConfig.webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should not trigger alerts when alerting is disabled', () => {
      const disabledConfig = { ...mockAlertConfig, enabled: false };
      const service = new SyncMonitoringService(disabledConfig);

      // Add many errors
      for (let i = 0; i < 10; i++) {
        service.logEvent('api_error', 'test_source', undefined, `Error ${i}`);
      }

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});