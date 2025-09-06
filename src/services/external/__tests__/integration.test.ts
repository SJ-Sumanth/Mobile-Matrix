import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExternalDataIntegrationService } from '../index.js';

// Mock all dependencies
vi.mock('../gsmarena.js');
vi.mock('../priceTracking.js');
vi.mock('../dataSyncService.js');
vi.mock('../syncMonitoring.js');
vi.mock('../fallbackService.js');
vi.mock('../../lib/database.js');
vi.mock('../../lib/cache.js');

describe('ExternalDataIntegrationService Integration Tests', () => {
  let service: ExternalDataIntegrationService;

  const mockConfig = {
    gsmarena: {
      apiKey: 'test-gsmarena-key',
      baseUrl: 'https://api.gsmarena.test',
      timeout: 5000,
      retryAttempts: 2,
    },
    priceTracking: {
      apiKey: 'test-price-key',
      baseUrl: 'https://api.pricetracking.test',
      timeout: 5000,
      retryAttempts: 2,
      enabledRetailers: ['amazon', 'flipkart'],
    },
    dataSync: {
      syncInterval: 60000,
      batchSize: 5,
      enabledSources: ['gsmarena', 'priceTracking'] as const,
      fallbackEnabled: true,
    },
    fallback: {
      enableCache: true,
      enableStaticData: true,
      enableAlternativeApis: false,
      cacheExpiryHours: 24,
      maxRetries: 3,
      retryDelayMs: 1000,
    },
    monitoring: {
      enabled: true,
      errorThreshold: 10,
      rateLimitThreshold: 5,
      syncFailureThreshold: 3,
    },
  };

  beforeEach(() => {
    service = new ExternalDataIntegrationService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize all sub-services correctly', () => {
      expect(service).toBeDefined();
      expect(service.getHealthStatus).toBeDefined();
      expect(service.performFullSync).toBeDefined();
      expect(service.syncPhoneData).toBeDefined();
    });

    it('should use provided configuration', () => {
      const customConfig = {
        ...mockConfig,
        monitoring: {
          ...mockConfig.monitoring,
          enabled: false,
        },
      };

      const customService = new ExternalDataIntegrationService(customConfig);
      expect(customService).toBeDefined();
    });

    it('should use default configuration when none provided', () => {
      const defaultService = new ExternalDataIntegrationService();
      expect(defaultService).toBeDefined();
    });
  });

  describe('Full Sync Workflow', () => {
    it('should perform complete sync workflow', async () => {
      // Mock the data sync service
      const { DataSyncService } = await import('../dataSyncService.js');
      const mockDataSyncService = {
        startFullSync: vi.fn().mockResolvedValue([
          {
            id: 'gsmarena-sync-1',
            source: 'gsmarena',
            status: 'completed',
            startTime: new Date(),
            endTime: new Date(),
            recordsProcessed: 100,
            recordsUpdated: 50,
            recordsCreated: 25,
            errors: [],
          },
          {
            id: 'price-sync-1',
            source: 'priceTracking',
            status: 'completed',
            startTime: new Date(),
            endTime: new Date(),
            recordsProcessed: 80,
            recordsUpdated: 40,
            recordsCreated: 0,
            errors: [],
          },
        ]),
      };

      vi.mocked(DataSyncService).mockImplementation(() => mockDataSyncService as any);

      // Reinitialize service with mocked dependencies
      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.performFullSync();

      expect(mockDataSyncService.startFullSync).toHaveBeenCalledOnce();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle sync failures gracefully', async () => {
      const { DataSyncService } = await import('../dataSyncService.js');
      const mockDataSyncService = {
        startFullSync: vi.fn().mockRejectedValue(new Error('Sync failed')),
      };

      vi.mocked(DataSyncService).mockImplementation(() => mockDataSyncService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      await expect(service.performFullSync()).rejects.toThrow('Sync failed');
    });
  });

  describe('Phone Data Sync', () => {
    it('should sync individual phone data successfully', async () => {
      const { DataSyncService } = await import('../dataSyncService.js');
      const mockDataSyncService = {
        syncPhoneData: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(DataSyncService).mockImplementation(() => mockDataSyncService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.syncPhoneData('phone-123');

      expect(result).toBe(true);
      expect(mockDataSyncService.syncPhoneData).toHaveBeenCalledWith('phone-123');
    });

    it('should handle phone sync failures', async () => {
      const { DataSyncService } = await import('../dataSyncService.js');
      const mockDataSyncService = {
        syncPhoneData: vi.fn().mockResolvedValue(false),
      };

      vi.mocked(DataSyncService).mockImplementation(() => mockDataSyncService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.syncPhoneData('phone-123');

      expect(result).toBe(false);
    });
  });

  describe('Data Retrieval with Fallbacks', () => {
    it('should get phone data with fallback support', async () => {
      const { GSMArenaService } = await import('../gsmarena.js');
      const { FallbackService } = await import('../fallbackService.js');

      const mockGSMArenaService = {
        searchPhones: vi.fn().mockResolvedValue([
          {
            id: '1',
            name: 'iPhone 15',
            brand: 'Apple',
            model: 'iPhone 15',
          },
        ]),
        convertToPhone: vi.fn().mockReturnValue({
          brand: 'Apple',
          model: 'iPhone 15',
          pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' },
        }),
      };

      const mockFallbackService = {
        getPhoneDataWithFallback: vi.fn().mockResolvedValue({
          success: true,
          data: {
            brand: 'Apple',
            model: 'iPhone 15',
            pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' },
          },
          source: 'alternative_api',
          fromCache: false,
        }),
      };

      vi.mocked(GSMArenaService).mockImplementation(() => mockGSMArenaService as any);
      vi.mocked(FallbackService).mockImplementation(() => mockFallbackService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.getPhoneData('Apple', 'iPhone 15');

      expect(result).toBeDefined();
      expect(mockFallbackService.getPhoneDataWithFallback).toHaveBeenCalled();
    });

    it('should get price data with fallback support', async () => {
      const { PriceTrackingService } = await import('../priceTracking.js');
      const { FallbackService } = await import('../fallbackService.js');

      const mockPriceTrackingService = {
        getPhonePrices: vi.fn().mockResolvedValue({
          phoneId: 'phone-1',
          prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock' }],
          lowestPrice: 75000,
          averagePrice: 75000,
        }),
        filterIndianRetailers: vi.fn().mockReturnValue({
          lowestPrice: 75000,
          averagePrice: 75000,
        }),
      };

      const mockFallbackService = {
        getPriceDataWithFallback: vi.fn().mockResolvedValue({
          success: true,
          data: { currentPrice: 75000, mrp: 79900 },
          source: 'alternative_api',
          fromCache: false,
        }),
      };

      vi.mocked(PriceTrackingService).mockImplementation(() => mockPriceTrackingService as any);
      vi.mocked(FallbackService).mockImplementation(() => mockFallbackService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.getPriceData('Apple', 'iPhone 15');

      expect(result).toBeDefined();
      expect(mockFallbackService.getPriceDataWithFallback).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should search phones across sources', async () => {
      const { GSMArenaService } = await import('../gsmarena.js');

      const mockGSMArenaService = {
        searchPhones: vi.fn().mockResolvedValue([
          {
            id: '1',
            name: 'iPhone 15',
            brand: 'Apple',
            model: 'iPhone 15',
          },
          {
            id: '2',
            name: 'Galaxy S24',
            brand: 'Samsung',
            model: 'Galaxy S24',
          },
        ]),
        convertToPhone: vi.fn()
          .mockReturnValueOnce({
            brand: 'Apple',
            model: 'iPhone 15',
          })
          .mockReturnValueOnce({
            brand: 'Samsung',
            model: 'Galaxy S24',
          }),
      };

      vi.mocked(GSMArenaService).mockImplementation(() => mockGSMArenaService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.searchPhones('flagship phones');

      expect(result).toHaveLength(2);
      expect(mockGSMArenaService.searchPhones).toHaveBeenCalledWith('flagship phones');
      expect(mockGSMArenaService.convertToPhone).toHaveBeenCalledTimes(2);
    });

    it('should handle search errors with fallback', async () => {
      const { GSMArenaService } = await import('../gsmarena.js');
      const { SyncMonitoringService } = await import('../syncMonitoring.js');

      const mockGSMArenaService = {
        searchPhones: vi.fn().mockRejectedValue(new Error('API error')),
      };

      const mockMonitoringService = {
        logApiError: vi.fn(),
      };

      vi.mocked(GSMArenaService).mockImplementation(() => mockGSMArenaService as any);
      vi.mocked(SyncMonitoringService).mockImplementation(() => mockMonitoringService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const result = await service.searchPhones('test query');

      expect(result).toEqual([]);
      expect(mockMonitoringService.logApiError).toHaveBeenCalledWith(
        'gsmarena',
        'search',
        'API error'
      );
    });
  });

  describe('Health and Monitoring', () => {
    it('should provide comprehensive health status', async () => {
      const { SyncMonitoringService } = await import('../syncMonitoring.js');
      const { FallbackService } = await import('../fallbackService.js');

      const mockMonitoringService = {
        generateHealthReport: vi.fn().mockReturnValue({
          status: 'healthy',
          summary: 'All systems operational',
          metrics: {},
          issues: [],
          recommendations: [],
        }),
      };

      const mockFallbackService = {
        getFallbackStats: vi.fn().mockReturnValue({
          staticDataEntries: 3,
          cacheHitRate: 85,
          fallbackActivations: 2,
        }),
      };

      vi.mocked(SyncMonitoringService).mockImplementation(() => mockMonitoringService as any);
      vi.mocked(FallbackService).mockImplementation(() => mockFallbackService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const health = service.getHealthStatus();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('fallback');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('automaticSync');
      expect(health.services.gsmarena.configured).toBe(true);
      expect(health.services.priceTracking.configured).toBe(true);
    });

    it('should provide monitoring metrics', async () => {
      const { SyncMonitoringService } = await import('../syncMonitoring.js');

      const mockMonitoringService = {
        getMetrics: vi.fn().mockReturnValue({
          totalSyncs: 10,
          successfulSyncs: 8,
          failedSyncs: 2,
          averageDuration: 5000,
          lastSyncTime: new Date(),
          apiRequestsCount: 100,
          apiErrorsCount: 5,
          rateLimitHits: 1,
          fallbackActivations: 3,
        }),
      };

      vi.mocked(SyncMonitoringService).mockImplementation(() => mockMonitoringService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const metrics = service.getMetrics();

      expect(metrics).toHaveProperty('totalSyncs');
      expect(metrics).toHaveProperty('successfulSyncs');
      expect(metrics).toHaveProperty('apiRequestsCount');
      expect(metrics.totalSyncs).toBe(10);
    });

    it('should provide recent events', async () => {
      const { SyncMonitoringService } = await import('../syncMonitoring.js');

      const mockEvents = [
        {
          id: '1',
          type: 'sync_completed' as const,
          source: 'gsmarena',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'api_request' as const,
          source: 'priceTracking',
          timestamp: new Date(),
        },
      ];

      const mockMonitoringService = {
        getEvents: vi.fn().mockReturnValue(mockEvents),
      };

      vi.mocked(SyncMonitoringService).mockImplementation(() => mockMonitoringService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      const events = service.getRecentEvents(24);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('sync_completed');
    });
  });

  describe('Automatic Sync Management', () => {
    it('should start and stop automatic sync', () => {
      service.startAutomaticSync();
      
      const health = service.getHealthStatus();
      expect(health.automaticSync.enabled).toBe(true);
      expect(health.automaticSync.interval).toBe(mockConfig.dataSync.syncInterval);

      service.stopAutomaticSync();
      
      // Note: We can't easily test the stopped state without exposing internal state
      // In a real implementation, you might want to add a method to check sync status
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', async () => {
      const { FallbackService } = await import('../fallbackService.js');

      const mockFallbackService = {
        clearCache: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(FallbackService).mockImplementation(() => mockFallbackService as any);

      service = new ExternalDataIntegrationService(mockConfig);

      await service.clearCache();

      expect(mockFallbackService.clearCache).toHaveBeenCalledOnce();
    });
  });

  describe('Service Cleanup', () => {
    it('should cleanup resources properly', async () => {
      service.startAutomaticSync();
      
      await service.cleanup();
      
      // Cleanup should stop automatic sync and clean up resources
      // This is mainly to ensure no errors are thrown during cleanup
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors', () => {
      const invalidConfig = {
        ...mockConfig,
        gsmarena: {
          ...mockConfig.gsmarena,
          apiKey: '', // Invalid empty API key
        },
      };

      // Should not throw during construction
      expect(() => new ExternalDataIntegrationService(invalidConfig)).not.toThrow();
    });

    it('should handle missing configuration gracefully', () => {
      const partialConfig = {
        gsmarena: mockConfig.gsmarena,
        // Missing other required config
      };

      expect(() => new ExternalDataIntegrationService(partialConfig as any)).not.toThrow();
    });
  });
});