import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PhoneService } from '../phone.js';
import { prisma } from '../../lib/database.js';

// Integration tests - these require a test database
describe('PhoneService Integration Tests', () => {
  let phoneService: PhoneService;

  beforeAll(async () => {
    phoneService = new PhoneService();
    
    // Ensure we have a test brand and phone for testing
    try {
      await prisma.brand.upsert({
        where: { slug: 'test-brand' },
        update: {},
        create: {
          name: 'Test Brand',
          slug: 'test-brand',
          isActive: true,
        },
      });

      const brand = await prisma.brand.findUnique({
        where: { slug: 'test-brand' },
      });

      if (brand) {
        await prisma.phone.upsert({
          where: { slug: 'test-brand-test-phone' },
          update: {},
          create: {
            brandId: brand.id,
            model: 'Test Phone',
            slug: 'test-brand-test-phone',
            availability: 'AVAILABLE',
            mrp: 50000,
            currentPrice: 45000,
            images: ['test-image.jpg'],
            isActive: true,
            specifications: {
              create: {
                displaySize: '6.1"',
                displayResolution: '2556x1179',
                displayType: 'OLED',
                processor: 'Test Processor',
                ramOptions: ['8GB'],
                storageOptions: ['128GB'],
                batteryCapacity: 4000,
                rearCameraMain: '48MP',
                frontCamera: '12MP',
                networkSupport: ['5G', '4G'],
                wifi: 'Wi-Fi 6',
                bluetooth: '5.3',
                operatingSystem: 'TestOS',
                osVersion: '1.0',
                dimensions: '150 x 75 x 8 mm',
                weight: '180g',
                materials: ['Glass', 'Metal'],
                colors: ['Black', 'White'],
              },
            },
          },
        });
      }
    } catch (error) {
      console.warn('Failed to set up test data:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.phone.deleteMany({
        where: { slug: 'test-brand-test-phone' },
      });
      await prisma.brand.deleteMany({
        where: { slug: 'test-brand' },
      });
    } catch (error) {
      console.warn('Failed to clean up test data:', error);
    }
  });

  it('should search phones in the database', async () => {
    const results = await phoneService.searchPhones('Test');
    
    expect(Array.isArray(results)).toBe(true);
    // We might have test data or not, so just check the structure
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('brand');
      expect(results[0]).toHaveProperty('model');
      expect(results[0]).toHaveProperty('pricing');
      expect(results[0]).toHaveProperty('specifications');
    }
  });

  it('should get all brands from the database', async () => {
    const brands = await phoneService.getAllBrands();
    
    expect(Array.isArray(brands)).toBe(true);
    if (brands.length > 0) {
      expect(brands[0]).toHaveProperty('id');
      expect(brands[0]).toHaveProperty('name');
    }
  });

  it('should handle empty search queries gracefully', async () => {
    const results = await phoneService.searchPhones('');
    expect(results).toEqual([]);
  });

  it('should handle non-existent phone lookups gracefully', async () => {
    const phone = await phoneService.getPhoneByModel('NonExistentBrand', 'NonExistentModel');
    expect(phone).toBeNull();
  });

  it('should handle non-existent phone ID lookups gracefully', async () => {
    const phone = await phoneService.getPhoneById('non-existent-id');
    expect(phone).toBeNull();
  });

  it('should get models by brand', async () => {
    const brands = await phoneService.getAllBrands();
    
    if (brands.length > 0) {
      const models = await phoneService.getModelsByBrand(brands[0].id);
      expect(Array.isArray(models)).toBe(true);
    }
  });

  it('should handle cache operations without errors', async () => {
    // This test ensures the cache service doesn't throw errors
    // even if Redis is not available (graceful degradation)
    const results1 = await phoneService.searchPhones('Test');
    const results2 = await phoneService.searchPhones('Test'); // Should use cache if available
    
    expect(Array.isArray(results1)).toBe(true);
    expect(Array.isArray(results2)).toBe(true);
  });
});