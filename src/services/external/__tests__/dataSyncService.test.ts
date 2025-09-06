import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataSyncService } from '../dataSyncService.js';
import { GSMArenaService } from '../gsmarena.js';
import { PriceTrackingService } from '../priceTracking.js';

// Mock the dependencies
vi.mock('../gsmarena.js');
vi.mock('../priceTracking.js');
vi.mock('../../lib/database.js', () => ({
  prisma: {
    brand: {
      findMany: vi.fn(),
    },
    phone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    phoneSpecification: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));
vi.mock('../../lib/cache.js', () => ({
  cacheService: {
    clear: vi.fn(),
  },
}));

const MockedGSMArenaService = vi.mocked(GSMArenaService);
const MockedPriceTrackingService = vi.mocked(PriceTrackingService);

describe('DataSyncService', () => {
  let service: DataSyncService;
  let mockGSMArenaService: any;
  let mockPriceTrackingService: any;

  const mockConfig = {
    gsmarena: {
      apiKey: 'test-key',
      baseUrl: 'https://test.com',
      timeout: 5000,
      retryAttempts: 2,
    },
    priceTracking: {
      apiKey: 'test-key',
      baseUrl: 'https://test.com',
      timeout: 5000,
      retryAttempts: 2,
      enabledRetailers: ['amazon', 'flipkart'],
    },
    syncInterval: 60000,
    batchSize: 5,
    enabledSources: ['gsmarena', 'priceTracking'] as const,
    fallbackEnabled: true,
  };

  beforeEach(() => {
    // Create mock instances
    mockGSMArenaService = {
      getPhonesByBrand: vi.fn(),
      convertToPhone: vi.fn(),
    };
    mockPriceTrackingService = {
      getPhonePrices: vi.fn(),
      filterIndianRetailers: vi.fn(),
    };

    // Mock constructors
    MockedGSMArenaService.mockImplementation(() => mockGSMArenaService);
    MockedPriceTrackingService.mockImplementation(() => mockPriceTrackingService);

    service = new DataSyncService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startFullSync', () => {
    it('should perform full sync successfully', async () => {
      // Mock database responses
      const { prisma } = await import('../../lib/database.js');
      vi.mocked(prisma.brand.findMany).mockResolvedValue([
        { id: '1', name: 'Apple', isActive: true },
        { id: '2', name: 'Samsung', isActive: true },
      ]);

      // Mock GSMArena responses
      mockGSMArenaService.getPhonesByBrand.mockResolvedValue([
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          model: 'iPhone 15',
          specifications: {},
        },
      ]);

      mockGSMArenaService.convertToPhone.mockReturnValue({
        brand: 'Apple',
        model: 'iPhone 15',
        pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' },
        specifications: {},
      });

      // Mock phone lookup
      vi.mocked(prisma.phone.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.phone.create).mockResolvedValue({ id: 'new-phone-id' });

      // Mock price tracking
      vi.mocked(prisma.phone.findMany).mockResolvedValue([
        {
          id: 'phone-1',
          model: 'iPhone 15',
          variant: null,
          brand: { name: 'Apple' },
        },
      ]);

      mockPriceTrackingService.getPhonePrices.mockResolvedValue({
        phoneId: 'phone-1',
        prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock' }],
        lowestPrice: 75000,
        averagePrice: 75000,
      });

      mockPriceTrackingService.filterIndianRetailers.mockReturnValue({
        prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock' }],
        lowestPrice: 75000,
        averagePrice: 75000,
      });

      vi.mocked(prisma.phone.update).mockResolvedValue({});

      const result = await service.startFullSync();

      expect(result).toHaveLength(2); // GSMArena + Price sync jobs
      expect(result[0].source).toBe('gsmarena');
      expect(result[1].source).toBe('priceTracking');
      expect(result.every(job => job.status === 'completed')).toBe(true);
    });

    it('should handle sync failures gracefully', async () => {
      // Mock database error
      const { prisma } = await import('../../lib/database.js');
      vi.mocked(prisma.brand.findMany).mockRejectedValue(new Error('Database error'));

      const result = await service.startFullSync();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('failed');
      expect(result[0].errors).toContain('Sync failed: Database error');
    });
  });

  describe('syncPhoneSpecifications', () => {
    it('should sync phone specifications successfully', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      // Mock brands
      vi.mocked(prisma.brand.findMany).mockResolvedValue([
        { id: '1', name: 'Apple', isActive: true },
      ]);

      // Mock GSMArena response
      mockGSMArenaService.getPhonesByBrand.mockResolvedValue([
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          model: 'iPhone 15',
          specifications: {
            display: { size: '6.1"', resolution: '2556x1179' },
            camera: { main: '48MP', front: '12MP' },
          },
        },
      ]);

      mockGSMArenaService.convertToPhone.mockReturnValue({
        brand: 'Apple',
        model: 'iPhone 15',
        specifications: {
          display: { size: '6.1"', resolution: '2556x1179', type: 'OLED' },
          camera: { rear: [{ megapixels: 48 }], front: { megapixels: 12 } },
        },
      });

      // Mock phone creation
      vi.mocked(prisma.phone.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.phone.create).mockResolvedValue({ id: 'new-phone-id' });
      vi.mocked(prisma.phoneSpecification.create).mockResolvedValue({});

      const result = await service.syncPhoneSpecifications();

      expect(result.status).toBe('completed');
      expect(result.recordsCreated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should update existing phones', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      vi.mocked(prisma.brand.findMany).mockResolvedValue([
        { id: '1', name: 'Apple', isActive: true },
      ]);

      mockGSMArenaService.getPhonesByBrand.mockResolvedValue([
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          model: 'iPhone 15',
        },
      ]);

      mockGSMArenaService.convertToPhone.mockReturnValue({
        brand: 'Apple',
        model: 'iPhone 15',
      });

      // Mock existing phone
      vi.mocked(prisma.phone.findFirst).mockResolvedValue({
        id: 'existing-phone-id',
        brandId: '1',
        model: 'iPhone 15',
      });
      vi.mocked(prisma.phone.update).mockResolvedValue({});
      vi.mocked(prisma.phoneSpecification.upsert).mockResolvedValue({});

      const result = await service.syncPhoneSpecifications();

      expect(result.status).toBe('completed');
      expect(result.recordsUpdated).toBe(1);
      expect(result.recordsCreated).toBe(0);
    });

    it('should handle validation errors', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      vi.mocked(prisma.brand.findMany).mockResolvedValue([
        { id: '1', name: 'Apple', isActive: true },
      ]);

      // Mock invalid phone data
      mockGSMArenaService.getPhonesByBrand.mockResolvedValue([
        {
          id: '1',
          name: 'Invalid Phone',
          brand: '', // Invalid: empty brand
          model: '',  // Invalid: empty model
        },
      ]);

      const result = await service.syncPhoneSpecifications();

      expect(result.status).toBe('completed');
      expect(result.recordsProcessed).toBe(1);
      expect(result.recordsCreated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('syncPriceData', () => {
    it('should sync price data successfully', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      // Mock phones
      vi.mocked(prisma.phone.findMany).mockResolvedValue([
        {
          id: 'phone-1',
          model: 'iPhone 15',
          variant: null,
          brand: { name: 'Apple' },
          isActive: true,
        },
      ]);

      // Mock price tracking response
      mockPriceTrackingService.getPhonePrices.mockResolvedValue({
        phoneId: 'phone-1',
        prices: [
          { price: 75000, retailer: 'Amazon India', availability: 'in_stock' },
          { price: 76000, retailer: 'Flipkart', availability: 'in_stock' },
        ],
        lowestPrice: 75000,
        averagePrice: 75500,
      });

      mockPriceTrackingService.filterIndianRetailers.mockReturnValue({
        prices: [
          { price: 75000, retailer: 'Amazon India', availability: 'in_stock' },
          { price: 76000, retailer: 'Flipkart', availability: 'in_stock' },
        ],
        lowestPrice: 75000,
        averagePrice: 75500,
      });

      vi.mocked(prisma.phone.update).mockResolvedValue({});

      const result = await service.syncPriceData();

      expect(result.status).toBe('completed');
      expect(result.recordsUpdated).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.phone.update).toHaveBeenCalledWith({
        where: { id: 'phone-1' },
        data: {
          currentPrice: 75000,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle price tracking failures', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      vi.mocked(prisma.phone.findMany).mockResolvedValue([
        {
          id: 'phone-1',
          model: 'iPhone 15',
          variant: null,
          brand: { name: 'Apple' },
          isActive: true,
        },
      ]);

      // Mock price tracking failure
      mockPriceTrackingService.getPhonePrices.mockRejectedValue(new Error('API error'));

      const result = await service.syncPriceData();

      expect(result.status).toBe('completed');
      expect(result.recordsProcessed).toBe(1);
      expect(result.recordsUpdated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should skip phones with no price data', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      vi.mocked(prisma.phone.findMany).mockResolvedValue([
        {
          id: 'phone-1',
          model: 'iPhone 15',
          variant: null,
          brand: { name: 'Apple' },
          isActive: true,
        },
      ]);

      // Mock no price data
      mockPriceTrackingService.getPhonePrices.mockResolvedValue(null);

      const result = await service.syncPriceData();

      expect(result.status).toBe('completed');
      expect(result.recordsProcessed).toBe(1);
      expect(result.recordsUpdated).toBe(0);
      expect(prisma.phone.update).not.toHaveBeenCalled();
    });
  });

  describe('syncPhoneData', () => {
    it('should sync individual phone data successfully', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      // Mock phone lookup
      vi.mocked(prisma.phone.findUnique).mockResolvedValue({
        id: 'phone-1',
        model: 'iPhone 15',
        variant: null,
        brand: { name: 'Apple' },
      });

      // Mock GSMArena search
      mockGSMArenaService.searchPhones.mockResolvedValue([
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          model: 'iPhone 15',
        },
      ]);

      mockGSMArenaService.convertToPhone.mockReturnValue({
        brand: 'Apple',
        model: 'iPhone 15',
        specifications: {},
      });

      // Mock price tracking
      mockPriceTrackingService.getPhonePrices.mockResolvedValue({
        phoneId: 'phone-1',
        prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock' }],
        lowestPrice: 75000,
      });

      mockPriceTrackingService.filterIndianRetailers.mockReturnValue({
        prices: [{ price: 75000, retailer: 'Amazon', availability: 'in_stock' }],
        lowestPrice: 75000,
      });

      vi.mocked(prisma.phone.update).mockResolvedValue({});
      vi.mocked(prisma.phoneSpecification.upsert).mockResolvedValue({});

      const result = await service.syncPhoneData('phone-1');

      expect(result).toBe(true);
      expect(prisma.phone.update).toHaveBeenCalledTimes(2); // Once for specs, once for price
    });

    it('should return false for non-existent phone', async () => {
      const { prisma } = await import('../../lib/database.js');
      
      vi.mocked(prisma.phone.findUnique).mockResolvedValue(null);

      const result = await service.syncPhoneData('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getSyncJobStatus', () => {
    it('should return sync job status', async () => {
      // Start a sync to create a job
      const { prisma } = await import('../../lib/database.js');
      vi.mocked(prisma.brand.findMany).mockResolvedValue([]);

      const syncPromise = service.syncPhoneSpecifications();
      
      // Get active jobs
      const activeJobs = service.getActiveSyncJobs();
      expect(activeJobs).toHaveLength(1);
      expect(activeJobs[0].source).toBe('gsmarena');
      expect(activeJobs[0].status).toBe('running');

      await syncPromise;

      // Job should be completed
      const jobStatus = service.getSyncJobStatus(activeJobs[0].id);
      expect(jobStatus?.status).toBe('completed');
    });
  });
});