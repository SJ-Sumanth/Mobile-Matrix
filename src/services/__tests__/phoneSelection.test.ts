import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { phoneSelectionService } from '../phoneSelection';
import { Brand, Phone, PhoneSelection } from '@/types/phone';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockBrands: Brand[] = [
  { id: '1', name: 'Samsung', logo: 'samsung-logo.png' },
  { id: '2', name: 'Apple', logo: 'apple-logo.png' },
  { id: '3', name: 'OnePlus', logo: 'oneplus-logo.png' },
];

const mockPhone: Phone = {
  id: '1',
  brand: 'Samsung',
  model: 'Galaxy S24',
  variant: '256GB',
  launchDate: new Date('2024-01-01'),
  availability: 'available',
  pricing: { mrp: 80000, currentPrice: 75000, currency: 'INR' },
  specifications: {
    display: { size: '6.2"', resolution: '2340x1080', type: 'AMOLED' },
    camera: { rear: [{ megapixels: 50, features: [] }], front: { megapixels: 12, features: [] }, features: [] },
    performance: { processor: 'Snapdragon 8 Gen 3', ram: ['8GB', '12GB'], storage: ['128GB', '256GB'] },
    battery: { capacity: 4000 },
    connectivity: { network: ['5G'], wifi: 'Wi-Fi 6', bluetooth: '5.3' },
    build: { dimensions: '147x70.6x7.6mm', weight: '167g', materials: ['Glass', 'Aluminum'], colors: ['Black', 'White'] },
    software: { os: 'Android', version: '14' },
  },
  images: ['image1.jpg'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSimilarPhones: Phone[] = [
  { ...mockPhone, id: '2', model: 'Galaxy S23', pricing: { mrp: 70000, currentPrice: 65000, currency: 'INR' } },
  { ...mockPhone, id: '3', model: 'Galaxy S24+', pricing: { mrp: 90000, currentPrice: 85000, currency: 'INR' } },
];

describe('PhoneSelectionService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    phoneSelectionService.clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchBrands', () => {
    it('should search brands successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBrands }),
      });

      const result = await phoneSelectionService.searchBrands('Sam');
      
      expect(result).toEqual(mockBrands);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/phones/brands/search?q=Sam',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle invalid brand name', async () => {
      await expect(phoneSelectionService.searchBrands('A')).rejects.toThrow('Invalid brand name format');
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(phoneSelectionService.searchBrands('Samsung')).rejects.toThrow('Failed to search brands: Internal Server Error');
    });

    it('should handle API response error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Database error' } }),
      });

      await expect(phoneSelectionService.searchBrands('Samsung')).rejects.toThrow('Database error');
    });

    it('should use cache for repeated searches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBrands }),
      });

      // First call
      const result1 = await phoneSelectionService.searchBrands('Samsung');
      
      // Second call should use cache
      const result2 = await phoneSelectionService.searchBrands('Samsung');
      
      expect(result1).toEqual(mockBrands);
      expect(result2).toEqual(mockBrands);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchModels', () => {
    it('should search models successfully', async () => {
      const mockModels = ['Galaxy S24', 'Galaxy S23', 'Galaxy Note 20'];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockModels }),
      });

      const result = await phoneSelectionService.searchModels('Galaxy', 'Samsung');
      
      expect(result).toEqual(mockModels);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/phones/models/search?brand=Samsung&q=Galaxy',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle invalid parameters', async () => {
      await expect(phoneSelectionService.searchModels('', 'Samsung')).rejects.toThrow('Invalid search parameters');
      await expect(phoneSelectionService.searchModels('Galaxy', '')).rejects.toThrow('Invalid search parameters');
    });

    it('should sanitize inputs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await phoneSelectionService.searchModels('Galaxy<script>', 'Samsung&test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/phones/models/search?brand=Samsung%26test&q=Galaxyscript',
        expect.any(Object)
      );
    });
  });

  describe('validateSelection', () => {
    const validSelection: PhoneSelection = {
      brand: 'Samsung',
      model: 'Galaxy S24',
      variant: '256GB',
    };

    it('should validate selection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { phone: mockPhone, isValid: true } }),
      });

      const result = await phoneSelectionService.validateSelection(validSelection);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should handle invalid selection format', async () => {
      const invalidSelection: PhoneSelection = {
        brand: '',
        model: 'Galaxy S24',
      };

      const result = await phoneSelectionService.validateSelection(invalidSelection);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please enter a valid brand name');
    });

    it('should handle phone not found with suggestions', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ success: false, error: { message: 'Phone not found' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSimilarPhones }),
        });

      const result = await phoneSelectionService.validateSelection(validSelection);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.suggestions).toEqual(mockSimilarPhones);
    });

    it('should sanitize selection inputs', async () => {
      const unsafeSelection: PhoneSelection = {
        brand: 'Samsung<script>',
        model: 'Galaxy S24&test',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { phone: mockPhone, isValid: true } }),
      });

      await phoneSelectionService.validateSelection(unsafeSelection);
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/phones/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            brand: 'Samsungscript',
            model: 'Galaxy S24test',
          }),
        })
      );
    });
  });

  describe('getSimilarPhones', () => {
    it('should get similar phones successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSimilarPhones }),
      });

      const result = await phoneSelectionService.getSimilarPhones('Samsung', 'Galaxy S24');
      
      expect(result).toEqual(mockSimilarPhones);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/phones/similar?brand=Samsung&model=Galaxy%20S24',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle invalid parameters gracefully', async () => {
      const result = await phoneSelectionService.getSimilarPhones('', 'Galaxy S24');
      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const result = await phoneSelectionService.getSimilarPhones('Samsung', 'Galaxy S24');
      expect(result).toEqual([]);
    });
  });

  describe('getPhoneByBrandAndModel', () => {
    it('should get phone successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPhone }),
      });

      const result = await phoneSelectionService.getPhoneByBrandAndModel('Samsung', 'Galaxy S24', '256GB');
      
      expect(result).toEqual(mockPhone);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/phones/by-brand-model?brand=Samsung&model=Galaxy%20S24&variant=256GB',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle phone not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await phoneSelectionService.getPhoneByBrandAndModel('Samsung', 'Galaxy S24');
      expect(result).toBeNull();
    });

    it('should handle invalid parameters', async () => {
      await expect(
        phoneSelectionService.getPhoneByBrandAndModel('', 'Galaxy S24')
      ).rejects.toThrow('Invalid phone parameters');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      // Clear cache
      phoneSelectionService.clearCache();
      
      // This should work without throwing
      expect(() => phoneSelectionService.clearCache()).not.toThrow();
    });
  });
});