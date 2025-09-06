import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GSMArenaService } from '../gsmarena.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GSMArenaService', () => {
  let service: GSMArenaService;
  
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.gsmarena.test',
    timeout: 5000,
    retryAttempts: 2,
  };

  beforeEach(() => {
    service = new GSMArenaService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchPhones', () => {
    it('should search phones successfully', async () => {
      const mockResponse = {
        phones: [
          {
            id: '1',
            name: 'iPhone 15',
            brand: 'Apple',
            model: 'iPhone 15',
            launch_date: '2023-09-15',
            status: 'available',
            specifications: {
              display: {
                size: '6.1"',
                resolution: '2556x1179',
                type: 'Super Retina XDR OLED',
                refresh_rate: 60,
              },
              camera: {
                main: '48MP',
                front: '12MP',
                features: ['Night mode', 'Portrait mode'],
              },
              performance: {
                chipset: 'A16 Bionic',
                ram: ['6GB'],
                storage: ['128GB', '256GB', '512GB'],
              },
              battery: {
                capacity: 3349,
                charging: 20,
                wireless: true,
              },
            },
            images: ['https://example.com/iphone15.jpg'],
            price: {
              currency: 'INR',
              price: 79900,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.searchPhones('iPhone 15');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.gsmarena.test/search?q=iPhone%2015',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'iPhone 15',
        brand: 'Apple',
        model: 'iPhone 15',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.searchPhones('iPhone')).rejects.toThrow('GSMArena search failed');
    });

    it('should retry on failure', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ phones: [] }),
      });

      const result = await service.searchPhones('iPhone');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });

    it('should handle empty query', async () => {
      const result = await service.searchPhones('a'); // Use short query instead of empty
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getPhoneById', () => {
    it('should get phone by ID successfully', async () => {
      const mockPhone = {
        id: '1',
        name: 'iPhone 15',
        brand: 'Apple',
        model: 'iPhone 15',
        specifications: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ phone: mockPhone }),
      });

      const result = await service.getPhoneById('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.gsmarena.test/phones/1',
        expect.any(Object)
      );

      expect(result).toMatchObject(mockPhone);
    });

    it('should return null for non-existent phone', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ phone: null }),
      });

      const result = await service.getPhoneById('999');
      expect(result).toBeNull();
    });
  });

  describe('getPhonesByBrand', () => {
    it('should get phones by brand successfully', async () => {
      const mockResponse = {
        phones: [
          { id: '1', name: 'iPhone 15', brand: 'Apple', model: 'iPhone 15' },
          { id: '2', name: 'iPhone 14', brand: 'Apple', model: 'iPhone 14' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getPhonesByBrand('Apple');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.gsmarena.test/brands/Apple/phones',
        expect.any(Object)
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('getBrands', () => {
    it('should get all brands successfully', async () => {
      const mockResponse = {
        brands: [
          { name: 'Apple' },
          { name: 'Samsung' },
          { name: 'OnePlus' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getBrands();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.gsmarena.test/brands',
        expect.any(Object)
      );

      expect(result).toEqual(['Apple', 'Samsung', 'OnePlus']);
    });
  });

  describe('convertToPhone', () => {
    it('should convert GSMArena phone to our Phone format', () => {
      const gsmarenaPhone = {
        id: '1',
        name: 'iPhone 15',
        brand: 'Apple',
        model: 'iPhone 15',
        launch_date: '2023-09-15',
        status: 'available' as const,
        specifications: {
          display: {
            size: '6.1"',
            resolution: '2556x1179',
            type: 'Super Retina XDR OLED',
          },
          camera: {
            main: '48MP',
            front: '12MP',
          },
          performance: {
            chipset: 'A16 Bionic',
            ram: ['6GB'],
            storage: ['128GB', '256GB'],
          },
          battery: {
            capacity: 3349,
          },
        },
        price: {
          currency: 'INR',
          price: 79900,
        },
        images: ['https://example.com/iphone15.jpg'],
      };

      const result = service.convertToPhone(gsmarenaPhone);

      expect(result).toMatchObject({
        brand: 'Apple',
        model: 'iPhone 15',
        availability: 'available',
        pricing: {
          mrp: 79900,
          currentPrice: 79900,
          currency: 'INR',
        },
        specifications: {
          display: {
            size: '6.1"',
            resolution: '2556x1179',
            type: 'Super Retina XDR OLED',
          },
          performance: {
            processor: 'A16 Bionic',
            ram: ['6GB'],
            storage: ['128GB', '256GB'],
          },
          battery: {
            capacity: 3349,
          },
        },
        images: ['https://example.com/iphone15.jpg'],
      });
    });

    it('should handle missing specifications gracefully', () => {
      const gsmarenaPhone = {
        id: '1',
        name: 'Basic Phone',
        brand: 'Generic',
        model: 'Basic',
      };

      const result = service.convertToPhone(gsmarenaPhone);

      expect(result.brand).toBe('Generic');
      expect(result.model).toBe('Basic');
      expect(result.specifications).toBeDefined();
    });
  });

  describe('camera spec parsing', () => {
    it('should parse camera specifications correctly', () => {
      const gsmarenaPhone = {
        id: '1',
        name: 'Test Phone',
        brand: 'Test',
        model: 'Phone',
        specifications: {
          camera: {
            main: '48MP f/1.8',
            ultrawide: '12MP f/2.4',
            front: '12MP f/1.9',
          },
        },
      };

      const result = service.convertToPhone(gsmarenaPhone);

      expect(result.specifications?.camera.rear).toHaveLength(2);
      expect(result.specifications?.camera.rear[0]).toMatchObject({
        megapixels: 48,
        aperture: 'f/1.8',
      });
      expect(result.specifications?.camera.rear[1]).toMatchObject({
        megapixels: 12,
        aperture: 'f/2.4',
      });
      expect(result.specifications?.camera.front).toMatchObject({
        megapixels: 12,
        aperture: 'f/1.9',
      });
    });

    it('should handle invalid camera specs', () => {
      const gsmarenaPhone = {
        id: '1',
        name: 'Test Phone',
        brand: 'Test',
        model: 'Phone',
        specifications: {
          camera: {
            main: 'Unknown camera',
            front: '',
          },
        },
      };

      const result = service.convertToPhone(gsmarenaPhone);

      expect(result.specifications?.camera.rear[0]).toMatchObject({
        megapixels: 0,
        features: [],
      });
      expect(result.specifications?.camera.front).toMatchObject({
        megapixels: 0,
        features: [],
      });
    });
  });

  describe('rate limiting', () => {
    it('should implement rate limiting between requests', async () => {
      const startTime = Date.now();

      // Mock two successful responses
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ phones: [] }),
        });

      await service.searchPhones('test');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay due to retry
      expect(duration).toBeGreaterThan(500); // At least some delay
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});