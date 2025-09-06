import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PriceTrackingService } from '../priceTracking.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PriceTrackingService', () => {
  let service: PriceTrackingService;
  
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.pricetracking.test',
    timeout: 5000,
    retryAttempts: 2,
    enabledRetailers: ['amazon', 'flipkart', 'croma', 'reliance'],
  };

  beforeEach(() => {
    service = new PriceTrackingService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPhonePrices', () => {
    it('should get phone prices successfully', async () => {
      const mockResponse = {
        priceData: {
          phoneId: 'test-phone-id',
          brand: 'Apple',
          model: 'iPhone 15',
          prices: [
            {
              retailer: 'Amazon India',
              price: 75000,
              currency: 'INR',
              availability: 'in_stock',
              url: 'https://amazon.in/iphone15',
              lastUpdated: '2024-01-01T00:00:00Z',
            },
            {
              retailer: 'Flipkart',
              price: 76000,
              currency: 'INR',
              availability: 'in_stock',
              url: 'https://flipkart.com/iphone15',
              lastUpdated: '2024-01-01T00:00:00Z',
            },
          ],
          averagePrice: 75500,
          lowestPrice: 75000,
          highestPrice: 76000,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getPhonePrices('Apple', 'iPhone 15');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pricetracking.test/prices/search?q=Apple%20iPhone%2015&country=IN',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toMatchObject({
        phoneId: 'test-phone-id',
        brand: 'Apple',
        model: 'iPhone 15',
        prices: expect.arrayContaining([
          expect.objectContaining({
            retailer: 'Amazon India',
            price: 75000,
            availability: 'in_stock',
          }),
        ]),
        lowestPrice: 75000,
        averagePrice: 75500,
      });
    });

    it('should handle variant in search query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ priceData: null }),
      });

      await service.getPhonePrices('Apple', 'iPhone 15', 'Pro Max');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=Apple%20iPhone%2015%20Pro%20Max'),
        expect.any(Object)
      );
    });

    it('should return null when no price data found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ priceData: null }),
      });

      const result = await service.getPhonePrices('Unknown', 'Phone');
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await service.getPhonePrices('Apple', 'iPhone');
      expect(result).toBeNull();
    });
  });

  describe('getPriceHistory', () => {
    it('should get price history successfully', async () => {
      const mockResponse = {
        history: [
          { date: '2024-01-01', price: 75000, retailer: 'Amazon' },
          { date: '2024-01-02', price: 74500, retailer: 'Flipkart' },
          { date: '2024-01-03', price: 75500, retailer: 'Amazon' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getPriceHistory('phone-123', 30);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pricetracking.test/prices/phone-123/history?days=30&country=IN',
        expect.any(Object)
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        date: '2024-01-01',
        price: 75000,
        retailer: 'Amazon',
      });
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getPriceHistory('phone-123');
      expect(result).toEqual([]);
    });
  });

  describe('trackPriceChanges', () => {
    it('should track price changes for multiple phones', async () => {
      const phoneIds = ['phone-1', 'phone-2', 'phone-3'];
      
      // Mock responses for each phone
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            priceData: {
              phoneId: 'phone-1',
              brand: 'Apple',
              model: 'iPhone 15',
              prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock', currency: 'INR', url: 'test.com', lastUpdated: '2024-01-01' }],
              averagePrice: 75000,
              lowestPrice: 75000,
              highestPrice: 75000,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            priceData: {
              phoneId: 'phone-2',
              brand: 'Samsung',
              model: 'Galaxy S24',
              prices: [{ price: 65000, retailer: 'Flipkart', availability: 'in_stock', currency: 'INR', url: 'test.com', lastUpdated: '2024-01-01' }],
              averagePrice: 65000,
              lowestPrice: 65000,
              highestPrice: 65000,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            priceData: {
              phoneId: 'phone-3',
              brand: 'OnePlus',
              model: '12',
              prices: [{ price: 85000, retailer: 'Croma', availability: 'in_stock', currency: 'INR', url: 'test.com', lastUpdated: '2024-01-01' }],
              averagePrice: 85000,
              lowestPrice: 85000,
              highestPrice: 85000,
            },
          }),
        });

      const result = await service.trackPriceChanges(phoneIds);

      expect(result.size).toBe(3);
      expect(result.get('phone-1')?.lowestPrice).toBe(75000);
      expect(result.get('phone-2')?.lowestPrice).toBe(65000);
      expect(result.get('phone-3')?.lowestPrice).toBe(85000);
    });

    it('should handle errors for individual phones gracefully', async () => {
      const phoneIds = ['phone-1', 'phone-2'];
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            priceData: {
              phoneId: 'phone-1',
              brand: 'Apple',
              model: 'iPhone 15',
              prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock', currency: 'INR', url: 'test.com', lastUpdated: '2024-01-01' }],
              averagePrice: 75000,
              lowestPrice: 75000,
              highestPrice: 75000,
            },
          }),
        })
        .mockRejectedValueOnce(new Error('API error for phone-2'));

      const result = await service.trackPriceChanges(phoneIds);

      expect(result.size).toBe(1);
      expect(result.has('phone-1')).toBe(true);
      expect(result.has('phone-2')).toBe(false);
    });

    it('should process phones in batches', async () => {
      const phoneIds = Array.from({ length: 12 }, (_, i) => `phone-${i + 1}`);
      
      // Mock all responses
      phoneIds.forEach((phoneId) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            priceData: {
              phoneId: phoneId,
              brand: 'Test',
              model: 'Phone',
              prices: [],
              averagePrice: 0,
              lowestPrice: 0,
              highestPrice: 0,
            },
          }),
        });
      });

      await service.trackPriceChanges(phoneIds);

      // Should be called 12 times (all phones)
      expect(mockFetch).toHaveBeenCalledTimes(12);
    });
  });

  describe('getBestDeals', () => {
    it('should get best deals under price limit', async () => {
      const mockResponse = {
        deals: [
          {
            phoneId: 'phone-1',
            brand: 'OnePlus',
            model: '11R',
            prices: [{ price: 35000, retailer: 'Amazon', availability: 'in_stock', currency: 'INR', url: 'test.com', lastUpdated: '2024-01-01' }],
            averagePrice: 35000,
            lowestPrice: 35000,
            highestPrice: 35000,
          },
          {
            phoneId: 'phone-2',
            brand: 'Xiaomi',
            model: '13',
            prices: [{ price: 40000, retailer: 'Flipkart', availability: 'in_stock', currency: 'INR', url: 'test.com', lastUpdated: '2024-01-01' }],
            averagePrice: 40000,
            lowestPrice: 40000,
            highestPrice: 40000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getBestDeals(50000, 'flagship');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('maxPrice=50000&country=IN&sortBy=discount&category=flagship'),
        expect.any(Object)
      );

      expect(result).toHaveLength(2);
      expect(result[0].lowestPrice).toBe(35000);
    });

    it('should handle missing category parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deals: [] }),
      });

      await service.getBestDeals(30000);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('category='),
        expect.any(Object)
      );
    });
  });

  describe('getPriceAlerts', () => {
    it('should get price alerts for significant drops', async () => {
      const mockResponse = {
        alerts: [
          { phoneId: 'phone-1', oldPrice: 80000, newPrice: 70000, discount: 12.5 },
          { phoneId: 'phone-2', oldPrice: 60000, newPrice: 50000, discount: 16.7 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getPriceAlerts(15);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pricetracking.test/alerts?threshold=15&country=IN',
        expect.any(Object)
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        phoneId: 'phone-1',
        oldPrice: 80000,
        newPrice: 70000,
        discount: 12.5,
      });
    });
  });

  describe('calculatePriceStats', () => {
    it('should calculate price statistics correctly', () => {
      const priceData = {
        phoneId: 'test',
        brand: 'Test',
        model: 'Phone',
        variant: undefined,
        prices: [
          { retailer: 'Amazon', price: 75000, currency: 'INR', availability: 'in_stock' as const, url: 'test', lastUpdated: '2024-01-01' },
          { retailer: 'Flipkart', price: 76000, currency: 'INR', availability: 'in_stock' as const, url: 'test', lastUpdated: '2024-01-01' },
          { retailer: 'Croma', price: 77000, currency: 'INR', availability: 'out_of_stock' as const, url: 'test', lastUpdated: '2024-01-01' },
          { retailer: 'Reliance', price: 74000, currency: 'INR', availability: 'in_stock' as const, url: 'test', lastUpdated: '2024-01-01' },
        ],
        averagePrice: 75500,
        lowestPrice: 74000,
        highestPrice: 77000,
      };

      const stats = service.calculatePriceStats(priceData);

      expect(stats.lowestPrice).toBe(74000);
      expect(stats.highestPrice).toBe(76000); // Only in-stock prices
      expect(stats.averagePrice).toBe(75000); // (75000 + 76000 + 74000) / 3
      expect(stats.priceRange).toBe(2000); // 76000 - 74000
      expect(stats.bestDeal?.retailer).toBe('Reliance');
      expect(stats.bestDeal?.price).toBe(74000);
    });

    it('should handle empty price data', () => {
      const priceData = {
        phoneId: 'test',
        brand: 'Test',
        model: 'Phone',
        variant: undefined,
        prices: [],
        averagePrice: 0,
        lowestPrice: 0,
        highestPrice: 0,
      };

      const stats = service.calculatePriceStats(priceData);

      expect(stats.lowestPrice).toBe(0);
      expect(stats.highestPrice).toBe(0);
      expect(stats.averagePrice).toBe(0);
      expect(stats.priceRange).toBe(0);
      expect(stats.bestDeal).toBeNull();
    });
  });

  describe('filterIndianRetailers', () => {
    it('should filter prices by Indian retailers', () => {
      const priceData = {
        phoneId: 'test',
        brand: 'Test',
        model: 'Phone',
        variant: undefined,
        prices: [
          { retailer: 'Amazon India', price: 75000, currency: 'INR', availability: 'in_stock' as const, url: 'amazon.in/test', lastUpdated: '2024-01-01' },
          { retailer: 'Best Buy US', price: 800, currency: 'USD', availability: 'in_stock' as const, url: 'bestbuy.com/test', lastUpdated: '2024-01-01' },
          { retailer: 'Flipkart', price: 76000, currency: 'INR', availability: 'in_stock' as const, url: 'flipkart.com/test', lastUpdated: '2024-01-01' },
          { retailer: 'Croma', price: 77000, currency: 'INR', availability: 'in_stock' as const, url: 'croma.com/test', lastUpdated: '2024-01-01' },
        ],
        averagePrice: 50000,
        lowestPrice: 800,
        highestPrice: 77000,
      };

      const filtered = service.filterIndianRetailers(priceData);

      expect(filtered.prices).toHaveLength(3); // Excludes Best Buy US
      expect(filtered.prices.every(p => 
        p.retailer.toLowerCase().includes('amazon') ||
        p.retailer.toLowerCase().includes('flipkart') ||
        p.retailer.toLowerCase().includes('croma')
      )).toBe(true);
      
      expect(filtered.lowestPrice).toBe(75000); // Recalculated without US price
      expect(filtered.highestPrice).toBe(77000);
    });
  });

  describe('retry logic', () => {
    it('should retry failed requests', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            priceData: { 
              phoneId: 'test', 
              brand: 'Test',
              model: 'Phone',
              prices: [],
              averagePrice: 0,
              lowestPrice: 0,
              highestPrice: 0,
            } 
          }),
        });

      const result = await service.getPhonePrices('Apple', 'iPhone');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).not.toBeNull();
    });

    it('should fail after max retries', async () => {
      // All calls fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await service.getPhonePrices('Apple', 'iPhone');

      expect(mockFetch).toHaveBeenCalledTimes(2); // retryAttempts
      expect(result).toBeNull();
    });
  });

  describe('rate limiting', () => {
    it('should implement rate limiting between retries', async () => {
      const startTime = Date.now();

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ priceData: null }),
        });

      await service.getPhonePrices('test', 'phone');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay due to retry with rate limiting
      expect(duration).toBeGreaterThan(1000); // At least 1 second delay
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});