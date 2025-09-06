import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { PhoneService } from '../phone.js';
import { prisma } from '../../lib/database.js';
import { cacheService } from '../../lib/cache.js';
import { Phone, Brand, PhoneModel } from '../../types/phone.js';

// Mock dependencies
vi.mock('../../lib/database.js', () => ({
  prisma: {
    phone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    brand: {
      findMany: vi.fn(),
    },
  },
  withRetry: vi.fn((fn) => fn()),
  withMetrics: vi.fn((fn) => fn()),
}));

vi.mock('../../lib/cache.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    exists: vi.fn(),
  },
  CacheKeys: {
    phone: (id: string) => `phone:${id}`,
    phoneByModel: (brand: string, model: string) => `phone:${brand}:${model}`,
    phonesByBrand: (brand: string) => `phones:brand:${brand}`,
    brands: () => 'brands:all',
    models: (brandId: string) => `models:brand:${brandId}`,
    search: (query: string) => `search:${query}`,
    similarPhones: (phoneId: string) => `similar:${phoneId}`,
  },
  CacheTTL: {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 86400,
  },
}));

describe('PhoneService', () => {
  let phoneService: PhoneService;
  let mockPrisma: any;
  let mockCache: any;

  beforeEach(() => {
    phoneService = new PhoneService();
    mockPrisma = prisma as any;
    mockCache = cacheService as any;
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('searchPhones', () => {
    const mockPhoneData = {
      id: '1',
      model: 'iPhone 15',
      variant: 'Pro',
      brandId: 'apple-1',
      launchDate: new Date('2023-09-15'),
      availability: 'AVAILABLE',
      mrp: 134900,
      currentPrice: 129900,
      images: ['image1.jpg'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: {
        id: 'apple-1',
        name: 'Apple',
        logoUrl: 'apple-logo.png',
      },
      specifications: {
        displaySize: '6.1"',
        displayResolution: '2556x1179',
        displayType: 'Super Retina XDR',
        processor: 'A17 Pro',
        ramOptions: ['8GB'],
        storageOptions: ['128GB', '256GB', '512GB', '1TB'],
        batteryCapacity: 3274,
        rearCameraMain: '48MP',
        frontCamera: '12MP',
        cameraFeatures: ['Night mode', 'Portrait mode'],
        networkSupport: ['5G', '4G LTE'],
        wifi: 'Wi-Fi 6E',
        bluetooth: '5.3',
        operatingSystem: 'iOS',
        osVersion: '17',
        dimensions: '147.6 x 71.6 x 8.25 mm',
        weight: '187g',
        materials: ['Titanium', 'Glass'],
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
      },
    };

    it('should return empty array for empty query', async () => {
      const result = await phoneService.searchPhones('');
      expect(result).toEqual([]);
    });

    it('should return empty array for query less than 2 characters', async () => {
      const result = await phoneService.searchPhones('a');
      expect(result).toEqual([]);
    });

    it('should return cached results if available', async () => {
      const cachedPhones: Phone[] = [{
        id: '1',
        brand: 'Apple',
        model: 'iPhone 15',
        variant: 'Pro',
        launchDate: new Date('2023-09-15'),
        availability: 'available',
        pricing: { mrp: 134900, currentPrice: 129900, currency: 'INR' },
        specifications: expect.any(Object),
        images: ['image1.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      mockCache.get.mockResolvedValue(cachedPhones);

      const result = await phoneService.searchPhones('iPhone');
      
      expect(mockCache.get).toHaveBeenCalledWith('search:iphone');
      expect(result).toEqual(cachedPhones);
      expect(mockPrisma.phone.findMany).not.toHaveBeenCalled();
    });

    it('should search database and cache results when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findMany.mockResolvedValue([mockPhoneData]);

      const result = await phoneService.searchPhones('iPhone');

      expect(mockCache.get).toHaveBeenCalledWith('search:iphone');
      expect(mockPrisma.phone.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                {
                  model: {
                    contains: 'iphone',
                    mode: 'insensitive',
                  },
                },
                {
                  brand: {
                    name: {
                      contains: 'iphone',
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  variant: {
                    contains: 'iphone',
                    mode: 'insensitive',
                  },
                },
              ],
            },
          ],
        },
        include: {
          brand: true,
          specifications: true,
        },
        orderBy: [
          { brand: { name: 'asc' } },
          { model: 'asc' },
          { variant: 'asc' },
        ],
        take: 50,
      });

      expect(mockCache.set).toHaveBeenCalledWith('search:iphone', expect.any(Array), 1800);
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Apple');
      expect(result[0].model).toBe('iPhone 15');
    });

    it('should handle database errors gracefully', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findMany.mockRejectedValue(new Error('Database error'));

      await expect(phoneService.searchPhones('iPhone')).rejects.toThrow('Failed to search phones');
    });
  });

  describe('getPhoneByModel', () => {
    const mockPhoneData = {
      id: '1',
      model: 'iPhone 15',
      variant: 'Pro',
      brandId: 'apple-1',
      launchDate: new Date('2023-09-15'),
      availability: 'AVAILABLE',
      mrp: 134900,
      currentPrice: 129900,
      images: ['image1.jpg'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: {
        id: 'apple-1',
        name: 'Apple',
        logoUrl: 'apple-logo.png',
      },
      specifications: null,
    };

    it('should return null for empty brand or model', async () => {
      expect(await phoneService.getPhoneByModel('', 'iPhone')).toBeNull();
      expect(await phoneService.getPhoneByModel('Apple', '')).toBeNull();
    });

    it('should return cached result if available', async () => {
      const cachedPhone: Phone = {
        id: '1',
        brand: 'Apple',
        model: 'iPhone 15',
        variant: 'Pro',
        launchDate: new Date('2023-09-15'),
        availability: 'available',
        pricing: { mrp: 134900, currentPrice: 129900, currency: 'INR' },
        specifications: expect.any(Object),
        images: ['image1.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCache.get.mockResolvedValue(cachedPhone);

      const result = await phoneService.getPhoneByModel('Apple', 'iPhone 15');
      
      expect(mockCache.get).toHaveBeenCalledWith('phone:apple:iphone 15');
      expect(result).toEqual(cachedPhone);
      expect(mockPrisma.phone.findFirst).not.toHaveBeenCalled();
    });

    it('should search database and cache result when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findFirst.mockResolvedValue(mockPhoneData);

      const result = await phoneService.getPhoneByModel('Apple', 'iPhone 15');

      expect(mockPrisma.phone.findFirst).toHaveBeenCalledWith({
        where: {
          AND: [
            { isActive: true },
            {
              brand: {
                name: {
                  equals: 'apple',
                  mode: 'insensitive',
                },
              },
            },
            {
              model: {
                equals: 'iphone 15',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          brand: true,
          specifications: true,
        },
      });

      expect(mockCache.set).toHaveBeenCalledWith('phone:apple:iphone 15', expect.any(Object), 3600);
      expect(result).not.toBeNull();
      expect(result?.brand).toBe('Apple');
      expect(result?.model).toBe('iPhone 15');
    });

    it('should return null when phone not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findFirst.mockResolvedValue(null);

      const result = await phoneService.getPhoneByModel('Apple', 'iPhone 20');

      expect(result).toBeNull();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('getPhoneById', () => {
    const mockPhoneData = {
      id: '1',
      model: 'iPhone 15',
      variant: 'Pro',
      brandId: 'apple-1',
      launchDate: new Date('2023-09-15'),
      availability: 'AVAILABLE',
      mrp: 134900,
      currentPrice: 129900,
      images: ['image1.jpg'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: {
        id: 'apple-1',
        name: 'Apple',
        logoUrl: 'apple-logo.png',
      },
      specifications: null,
    };

    it('should return null for empty ID', async () => {
      const result = await phoneService.getPhoneById('');
      expect(result).toBeNull();
    });

    it('should return cached result if available', async () => {
      const cachedPhone: Phone = {
        id: '1',
        brand: 'Apple',
        model: 'iPhone 15',
        variant: 'Pro',
        launchDate: new Date('2023-09-15'),
        availability: 'available',
        pricing: { mrp: 134900, currentPrice: 129900, currency: 'INR' },
        specifications: expect.any(Object),
        images: ['image1.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCache.get.mockResolvedValue(cachedPhone);

      const result = await phoneService.getPhoneById('1');
      
      expect(mockCache.get).toHaveBeenCalledWith('phone:1');
      expect(result).toEqual(cachedPhone);
      expect(mockPrisma.phone.findUnique).not.toHaveBeenCalled();
    });

    it('should search database and cache result when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findUnique.mockResolvedValue(mockPhoneData);

      const result = await phoneService.getPhoneById('1');

      expect(mockPrisma.phone.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          brand: true,
          specifications: true,
        },
      });

      expect(mockCache.set).toHaveBeenCalledWith('phone:1', expect.any(Object), 3600);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });
  });

  describe('getAllBrands', () => {
    const mockBrandData = [
      {
        id: 'apple-1',
        name: 'Apple',
        slug: 'apple',
        logoUrl: 'apple-logo.png',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'samsung-1',
        name: 'Samsung',
        slug: 'samsung',
        logoUrl: 'samsung-logo.png',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return cached brands if available', async () => {
      const cachedBrands: Brand[] = [
        { id: 'apple-1', name: 'Apple', logo: 'apple-logo.png' },
        { id: 'samsung-1', name: 'Samsung', logo: 'samsung-logo.png' },
      ];

      mockCache.get.mockResolvedValue(cachedBrands);

      const result = await phoneService.getAllBrands();
      
      expect(mockCache.get).toHaveBeenCalledWith('brands:all');
      expect(result).toEqual(cachedBrands);
      expect(mockPrisma.brand.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.brand.findMany.mockResolvedValue(mockBrandData);

      const result = await phoneService.getAllBrands();

      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      expect(mockCache.set).toHaveBeenCalledWith('brands:all', expect.any(Array), 86400);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Apple');
      expect(result[1].name).toBe('Samsung');
    });
  });

  describe('getModelsByBrand', () => {
    const mockPhoneData = [
      {
        id: '1',
        brandId: 'apple-1',
        model: 'iPhone 15',
        variant: 'Pro',
        launchDate: new Date('2023-09-15'),
      },
      {
        id: '2',
        brandId: 'apple-1',
        model: 'iPhone 15',
        variant: 'Pro Max',
        launchDate: new Date('2023-09-15'),
      },
      {
        id: '3',
        brandId: 'apple-1',
        model: 'iPhone 14',
        variant: null,
        launchDate: new Date('2022-09-15'),
      },
    ];

    it('should return empty array for empty brand ID', async () => {
      const result = await phoneService.getModelsByBrand('');
      expect(result).toEqual([]);
    });

    it('should return cached models if available', async () => {
      const cachedModels: PhoneModel[] = [
        { id: '1', brandId: 'apple-1', name: 'iPhone 15', series: 'Pro', launchYear: 2023 },
        { id: '3', brandId: 'apple-1', name: 'iPhone 14', launchYear: 2022 },
      ];

      mockCache.get.mockResolvedValue(cachedModels);

      const result = await phoneService.getModelsByBrand('apple-1');
      
      expect(mockCache.get).toHaveBeenCalledWith('models:brand:apple-1');
      expect(result).toEqual(cachedModels);
      expect(mockPrisma.phone.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findMany.mockResolvedValue(mockPhoneData);

      const result = await phoneService.getModelsByBrand('apple-1');

      expect(mockPrisma.phone.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { brandId: 'apple-1' },
            { isActive: true },
          ],
        },
        select: {
          id: true,
          brandId: true,
          model: true,
          variant: true,
          launchDate: true,
        },
        orderBy: [
          { model: 'asc' },
          { variant: 'asc' },
        ],
      });

      expect(mockCache.set).toHaveBeenCalledWith('models:brand:apple-1', expect.any(Array), 3600);
      expect(result).toHaveLength(2); // Should group by model name
      expect(result[0].name).toBe('iPhone 15');
      expect(result[1].name).toBe('iPhone 14');
    });
  });

  describe('getSimilarPhones', () => {
    const mockPhone: Phone = {
      id: '1',
      brand: 'Apple',
      model: 'iPhone 15',
      variant: 'Pro',
      launchDate: new Date('2023-09-15'),
      availability: 'available',
      pricing: { mrp: 134900, currentPrice: 129900, currency: 'INR' },
      specifications: expect.any(Object),
      images: ['image1.jpg'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSimilarPhoneData = [
      {
        id: '2',
        model: 'iPhone 14',
        variant: 'Pro',
        brandId: 'apple-1',
        launchDate: new Date('2022-09-15'),
        availability: 'AVAILABLE',
        mrp: 129900,
        currentPrice: 119900,
        images: ['image2.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        brand: {
          id: 'apple-1',
          name: 'Apple',
          logoUrl: 'apple-logo.png',
        },
        specifications: null,
      },
    ];

    it('should return cached similar phones if available', async () => {
      const cachedSimilarPhones: Phone[] = [
        {
          id: '2',
          brand: 'Apple',
          model: 'iPhone 14',
          variant: 'Pro',
          launchDate: new Date('2022-09-15'),
          availability: 'available',
          pricing: { mrp: 129900, currentPrice: 119900, currency: 'INR' },
          specifications: expect.any(Object),
          images: ['image2.jpg'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCache.get.mockResolvedValue(cachedSimilarPhones);

      const result = await phoneService.getSimilarPhones(mockPhone, 3);
      
      expect(mockCache.get).toHaveBeenCalledWith('similar:1');
      expect(result).toEqual(cachedSimilarPhones);
      expect(mockPrisma.phone.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findMany.mockResolvedValue(mockSimilarPhoneData);

      const result = await phoneService.getSimilarPhones(mockPhone, 3);

      const priceRange = mockPhone.pricing.currentPrice * 0.2;
      const minPrice = mockPhone.pricing.currentPrice - priceRange;
      const maxPrice = mockPhone.pricing.currentPrice + priceRange;

      expect(mockPrisma.phone.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { isActive: true },
            { id: { not: mockPhone.id } },
            {
              OR: [
                {
                  AND: [
                    { currentPrice: { gte: minPrice } },
                    { currentPrice: { lte: maxPrice } },
                  ],
                },
                { brandId: mockPhone.brand },
              ],
            },
          ],
        },
        include: {
          brand: true,
          specifications: true,
        },
        orderBy: [
          { currentPrice: 'asc' },
          { model: 'asc' },
        ],
        take: 6, // limit * 2
      });

      expect(mockCache.set).toHaveBeenCalledWith('similar:1', expect.any(Array), 1800);
      expect(result).toHaveLength(1);
      expect(result[0].model).toBe('iPhone 14');
    });

    it('should handle errors gracefully and return empty array', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.phone.findMany.mockRejectedValue(new Error('Database error'));

      const result = await phoneService.getSimilarPhones(mockPhone);

      expect(result).toEqual([]);
    });
  });

  describe('updatePhoneData', () => {
    it('should clear cache when updating phone data', async () => {
      await phoneService.updatePhoneData();

      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should handle errors during update', async () => {
      mockCache.clear.mockRejectedValue(new Error('Cache error'));

      await expect(phoneService.updatePhoneData()).rejects.toThrow('Failed to update phone data');
    });
  });
});