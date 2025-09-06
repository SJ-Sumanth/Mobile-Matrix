import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FallbackService } from '../fallbackService.js';
import { SyncMonitoringService } from '../syncMonitoring.js';

// Mock dependencies
vi.mock('../../lib/cache.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('FallbackService', () => {
  let fallbackService: FallbackService;
  let mockMonitoring: SyncMonitoringService;

  const mockConfig = {
    enableCache: true,
    enableStaticData: true,
    enableAlternativeApis: false,
    cacheExpiryHours: 24,
    maxRetries: 3,
    retryDelayMs: 1000,
  };

  beforeEach(() => {
    // Create mock monitoring service
    mockMonitoring = {
      logFallbackActivation: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({ fallbackActivations: 0 }),
    } as any;

    fallbackService = new FallbackService(mockConfig, mockMonitoring);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPhoneDataWithFallback', () => {
    it('should return primary data when available', async () => {
      const mockPhoneData = {
        brand: 'Apple',
        model: 'iPhone 15',
        pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' as const },
      };

      const primaryFetcher = vi.fn().mockResolvedValue(mockPhoneData);

      const result = await fallbackService.getPhoneDataWithFallback(
        'Apple',
        'iPhone 15',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPhoneData);
      expect(result.source).toBe('alternative_api');
      expect(result.fromCache).toBe(false);
      expect(primaryFetcher).toHaveBeenCalledOnce();
    });

    it('should fall back to cache when primary fails', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      const mockCachedData = {
        brand: 'Apple',
        model: 'iPhone 15',
        pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' as const },
      };

      const primaryFetcher = vi.fn().mockRejectedValue(new Error('API failed'));
      vi.mocked(cacheService.get).mockResolvedValue(mockCachedData);

      const result = await fallbackService.getPhoneDataWithFallback(
        'Apple',
        'iPhone 15',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCachedData);
      expect(result.source).toBe('cache');
      expect(result.fromCache).toBe(true);
      expect(mockMonitoring.logFallbackActivation).toHaveBeenCalledWith(
        'fallback_service',
        'Primary API unavailable',
        'cache'
      );
    });

    it('should fall back to static data when cache fails', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      
      const primaryFetcher = vi.fn().mockRejectedValue(new Error('API failed'));
      vi.mocked(cacheService.get).mockResolvedValue(null);

      // Add static data
      fallbackService.addStaticPhoneData('apple-iphone-15', {
        brand: 'Apple',
        model: 'iPhone 15',
        pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' as const },
      });

      const result = await fallbackService.getPhoneDataWithFallback(
        'Apple',
        'iPhone 15',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('static');
      expect(result.fromCache).toBe(false);
    });

    it('should return failure when all fallbacks fail', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      
      const primaryFetcher = vi.fn().mockRejectedValue(new Error('API failed'));
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const result = await fallbackService.getPhoneDataWithFallback(
        'Unknown',
        'Phone',
        primaryFetcher
      );

      expect(result.success).toBe(false);
      expect(result.source).toBe('manual');
      expect(result.error).toBe('All fallback mechanisms failed');
    });
  });

  describe('getSpecificationsWithFallback', () => {
    it('should return primary specifications when available', async () => {
      const mockSpecs = {
        display: { size: '6.1"', resolution: '2556x1179', type: 'OLED' },
        camera: { rear: [], front: { megapixels: 12, features: [] }, features: [] },
        performance: { processor: 'A16 Bionic', ram: ['6GB'], storage: ['128GB'] },
        battery: { capacity: 3349 },
        connectivity: { network: ['5G'], wifi: 'Wi-Fi 6', bluetooth: '5.3' },
        build: { dimensions: '147.6x71.6x7.8mm', weight: '171g', materials: [], colors: [] },
        software: { os: 'iOS', version: '17' },
      };

      const primaryFetcher = vi.fn().mockResolvedValue(mockSpecs);

      const result = await fallbackService.getSpecificationsWithFallback(
        'phone-1',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSpecs);
      expect(result.source).toBe('alternative_api');
    });

    it('should return default specifications when all fails', async () => {
      const primaryFetcher = vi.fn().mockRejectedValue(new Error('API failed'));
      const { cacheService } = await import('../../lib/cache.js');
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const result = await fallbackService.getSpecificationsWithFallback(
        'phone-1',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('static');
      expect(result.data?.display.size).toBe('Unknown');
      expect(result.data?.camera.rear).toEqual([]);
    });
  });

  describe('getPriceDataWithFallback', () => {
    it('should return primary price data when available', async () => {
      const mockPriceData = { currentPrice: 75000, mrp: 79900 };
      const primaryFetcher = vi.fn().mockResolvedValue(mockPriceData);

      const result = await fallbackService.getPriceDataWithFallback(
        'phone-1',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPriceData);
      expect(result.source).toBe('alternative_api');
    });

    it('should return cached price data when primary fails', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      const mockCachedPrice = { currentPrice: 75000, mrp: 79900 };

      const primaryFetcher = vi.fn().mockRejectedValue(new Error('API failed'));
      vi.mocked(cacheService.get).mockResolvedValue(mockCachedPrice);

      const result = await fallbackService.getPriceDataWithFallback(
        'phone-1',
        primaryFetcher
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCachedPrice);
      expect(result.source).toBe('cache');
    });

    it('should return failure when no price data available', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      
      const primaryFetcher = vi.fn().mockRejectedValue(new Error('API failed'));
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const result = await fallbackService.getPriceDataWithFallback(
        'phone-1',
        primaryFetcher
      );

      expect(result.success).toBe(false);
      expect(result.source).toBe('manual');
      expect(result.error).toBe('No price data available');
    });
  });

  describe('retry logic', () => {
    it('should retry failed operations', async () => {
      const primaryFetcher = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({ success: true });

      const result = await fallbackService.getPhoneDataWithFallback(
        'Apple',
        'iPhone',
        primaryFetcher
      );

      expect(primaryFetcher).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('should fail after max retries', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const primaryFetcher = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      const result = await fallbackService.getPhoneDataWithFallback(
        'Unknown',
        'Phone',
        primaryFetcher
      );

      expect(primaryFetcher).toHaveBeenCalledTimes(3); // maxRetries
      expect(result.success).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache successful results', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      const mockPhoneData = {
        brand: 'Apple',
        model: 'iPhone 15',
      };

      const primaryFetcher = vi.fn().mockResolvedValue(mockPhoneData);

      await fallbackService.getPhoneDataWithFallback(
        'Apple',
        'iPhone 15',
        primaryFetcher
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        'fallback:phone:apple-iphone 15',
        mockPhoneData,
        24 * 60 * 60 * 1000 // 24 hours in ms
      );
    });

    it('should not cache when caching is disabled', async () => {
      const { cacheService } = await import('../../lib/cache.js');
      
      const disabledCacheConfig = { ...mockConfig, enableCache: false };
      const service = new FallbackService(disabledCacheConfig, mockMonitoring);

      const mockPhoneData = { brand: 'Apple', model: 'iPhone 15' };
      const primaryFetcher = vi.fn().mockResolvedValue(mockPhoneData);

      await service.getPhoneDataWithFallback('Apple', 'iPhone 15', primaryFetcher);

      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('static data management', () => {
    it('should add and retrieve static phone data', () => {
      const phoneData = {
        brand: 'Apple',
        model: 'iPhone 15',
        pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' as const },
      };

      fallbackService.addStaticPhoneData('apple-iphone-15', phoneData);

      const stats = fallbackService.getFallbackStats();
      expect(stats.staticDataEntries).toBe(4); // 3 initial + 1 added
    });
  });

  describe('getFallbackStats', () => {
    it('should return fallback statistics', () => {
      const stats = fallbackService.getFallbackStats();

      expect(stats).toHaveProperty('staticDataEntries');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('fallbackActivations');
      expect(typeof stats.staticDataEntries).toBe('number');
    });
  });

  describe('clearCache', () => {
    it('should clear cache without errors', async () => {
      await expect(fallbackService.clearCache()).resolves.not.toThrow();
    });
  });
});