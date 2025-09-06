import { prisma, withRetry, withMetrics } from '../lib/database.js';
import { cacheService, CacheKeys, CacheTTL } from '../lib/cache.js';
import { PhoneService as IPhoneService } from '../types/services.js';
import { 
  Phone, 
  Brand, 
  PhoneModel, 
  PhoneSchema,
  BrandSchema,
  PhoneModelSchema,
  PhoneAvailability 
} from '../types/phone.js';
import { Prisma } from '../generated/prisma/index.js';

/**
 * Phone database service implementation with caching
 */
export class PhoneService implements IPhoneService {
  private cache = cacheService;

  /**
   * Search phones by query string with caching
   */
  async searchPhones(query: string): Promise<Phone[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = CacheKeys.search(normalizedQuery);

    // Try to get from cache first
    const cachedResult = await this.cache.get<Phone[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const phones = await withMetrics(async () => {
        return await withRetry(async () => {
          const results = await prisma.phone.findMany({
            where: {
              AND: [
                { isActive: true },
                {
                  OR: [
                    {
                      model: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                    {
                      brand: {
                        name: {
                          contains: normalizedQuery,
                          mode: 'insensitive',
                        },
                      },
                    },
                    {
                      variant: {
                        contains: normalizedQuery,
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
            take: 50, // Limit results for performance
          });

          return results.map((result) => this.mapPrismaPhoneToPhone(result));
        });
      });

      // Cache the results
      await this.cache.set(cacheKey, phones, CacheTTL.MEDIUM);
      return phones;
    } catch (error) {
      console.error('Error searching phones:', error);
      throw new Error('Failed to search phones');
    }
  }

  /**
   * Get phone by brand and model with caching
   */
  async getPhoneByModel(brand: string, model: string): Promise<Phone | null> {
    if (!brand || !model) {
      return null;
    }

    const normalizedBrand = brand.trim().toLowerCase();
    const normalizedModel = model.trim().toLowerCase();
    const cacheKey = CacheKeys.phoneByModel(normalizedBrand, normalizedModel);

    // Try to get from cache first
    const cachedResult = await this.cache.get<Phone>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const phone = await withMetrics(async () => {
        return await withRetry(async () => {
          const result = await prisma.phone.findFirst({
            where: {
              AND: [
                { isActive: true },
                {
                  brand: {
                    name: {
                      equals: normalizedBrand,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  model: {
                    equals: normalizedModel,
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

          return result ? this.mapPrismaPhoneToPhone(result) : null;
        });
      });

      if (phone) {
        // Cache the result
        await this.cache.set(cacheKey, phone, CacheTTL.LONG);
      }

      return phone;
    } catch (error) {
      console.error('Error getting phone by model:', error);
      throw new Error('Failed to get phone by model');
    }
  }

  /**
   * Get phone by ID with caching
   */
  async getPhoneById(id: string): Promise<Phone | null> {
    if (!id) {
      return null;
    }

    const cacheKey = CacheKeys.phone(id);

    // Try to get from cache first
    const cachedResult = await this.cache.get<Phone>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const phone = await withMetrics(async () => {
        return await withRetry(async () => {
          const result = await prisma.phone.findUnique({
            where: { id },
            include: {
              brand: true,
              specifications: true,
            },
          });

          return result ? this.mapPrismaPhoneToPhone(result) : null;
        });
      });

      if (phone) {
        // Cache the result
        await this.cache.set(cacheKey, phone, CacheTTL.LONG);
      }

      return phone;
    } catch (error) {
      console.error('Error getting phone by ID:', error);
      throw new Error('Failed to get phone by ID');
    }
  }

  /**
   * Get all available brands with caching
   */
  async getAllBrands(): Promise<Brand[]> {
    const cacheKey = CacheKeys.brands();

    // Try to get from cache first
    const cachedResult = await this.cache.get<Brand[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const brands = await withMetrics(async () => {
        return await withRetry(async () => {
          const results = await prisma.brand.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
          });

          return results.map((result) => this.mapPrismaBrandToBrand(result));
        });
      });

      // Cache the results for a long time since brands don't change often
      await this.cache.set(cacheKey, brands, CacheTTL.VERY_LONG);
      return brands;
    } catch (error) {
      console.error('Error getting all brands:', error);
      throw new Error('Failed to get brands');
    }
  }

  /**
   * Get models by brand ID with caching
   */
  async getModelsByBrand(brandId: string): Promise<PhoneModel[]> {
    if (!brandId) {
      return [];
    }

    const cacheKey = CacheKeys.models(brandId);

    // Try to get from cache first
    const cachedResult = await this.cache.get<PhoneModel[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const models = await withMetrics(async () => {
        return await withRetry(async () => {
          const results = await prisma.phone.findMany({
            where: {
              AND: [
                { brandId },
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

          // Group by model and create PhoneModel objects
          const modelMap = new Map<string, PhoneModel>();
          
          results.forEach((phone) => {
            if (!modelMap.has(phone.model)) {
              modelMap.set(phone.model, {
                id: phone.id,
                brandId: phone.brandId,
                name: phone.model,
                series: phone.variant || undefined,
                launchYear: phone.launchDate ? phone.launchDate.getFullYear() : new Date().getFullYear(),
              });
            }
          });

          return Array.from(modelMap.values());
        });
      });

      // Cache the results
      await this.cache.set(cacheKey, models, CacheTTL.LONG);
      return models;
    } catch (error) {
      console.error('Error getting models by brand:', error);
      throw new Error('Failed to get models by brand');
    }
  }

  /**
   * Get phones by brand with caching
   */
  async getPhonesByBrand(brandName: string): Promise<Phone[]> {
    if (!brandName) {
      return [];
    }

    const normalizedBrand = brandName.trim().toLowerCase();
    const cacheKey = CacheKeys.phonesByBrand(normalizedBrand);

    // Try to get from cache first
    const cachedResult = await this.cache.get<Phone[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const phones = await withMetrics(async () => {
        return await withRetry(async () => {
          const results = await prisma.phone.findMany({
            where: {
              AND: [
                { isActive: true },
                {
                  brand: {
                    name: {
                      equals: normalizedBrand,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
            include: {
              brand: true,
              specifications: true,
            },
            orderBy: [
              { model: 'asc' },
              { variant: 'asc' },
            ],
          });

          return results.map((result) => this.mapPrismaPhoneToPhone(result));
        });
      });

      // Cache the results
      await this.cache.set(cacheKey, phones, CacheTTL.LONG);
      return phones;
    } catch (error) {
      console.error('Error getting phones by brand:', error);
      throw new Error('Failed to get phones by brand');
    }
  }

  /**
   * Get similar phones based on specifications
   */
  async getSimilarPhones(phone: Phone, limit = 5): Promise<Phone[]> {
    const cacheKey = CacheKeys.similarPhones(phone.id);

    // Try to get from cache first
    const cachedResult = await this.cache.get<Phone[]>(cacheKey);
    if (cachedResult) {
      return cachedResult.slice(0, limit);
    }

    try {
      const similarPhones = await withMetrics(async () => {
        return await withRetry(async () => {
          // Find phones with similar price range and specifications
          const priceRange = phone.pricing.currentPrice * 0.2; // 20% price range
          const minPrice = phone.pricing.currentPrice - priceRange;
          const maxPrice = phone.pricing.currentPrice + priceRange;

          const results = await prisma.phone.findMany({
            where: {
              AND: [
                { isActive: true },
                { id: { not: phone.id } }, // Exclude the current phone
                {
                  OR: [
                    // Similar price range
                    {
                      AND: [
                        { currentPrice: { gte: minPrice } },
                        { currentPrice: { lte: maxPrice } },
                      ],
                    },
                    // Same brand
                    { brandId: phone.brand },
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
            take: limit * 2, // Get more to filter later
          });

          return results.map((result) => this.mapPrismaPhoneToPhone(result));
        });
      });

      // Cache the results
      await this.cache.set(cacheKey, similarPhones, CacheTTL.MEDIUM);
      return similarPhones.slice(0, limit);
    } catch (error) {
      console.error('Error getting similar phones:', error);
      return [];
    }
  }

  /**
   * Update phone data from external sources
   * This is a placeholder for future implementation
   */
  async updatePhoneData(): Promise<void> {
    try {
      console.log('Phone data update initiated...');
      
      // Clear relevant caches when data is updated
      await this.cache.clear();
      
      // TODO: Implement external data source integration
      // This would typically involve:
      // 1. Fetching data from external APIs (GSMArena, etc.)
      // 2. Validating and sanitizing the data
      // 3. Updating the database with new information
      // 4. Clearing relevant caches
      
      console.log('Phone data update completed');
    } catch (error) {
      console.error('Error updating phone data:', error);
      throw new Error('Failed to update phone data');
    }
  }

  /**
   * Validate phone data against schema
   */
  private validatePhoneData(data: any): Phone {
    try {
      return PhoneSchema.parse(data);
    } catch (error) {
      console.error('Phone data validation failed:', error);
      throw new Error('Invalid phone data format');
    }
  }

  /**
   * Sanitize phone data for safe storage
   */
  private sanitizePhoneData(data: Partial<Phone>): Partial<Phone> {
    return {
      ...data,
      brand: data.brand?.trim(),
      model: data.model?.trim(),
      variant: data.variant?.trim(),
      images: data.images?.filter(img => img && img.trim().length > 0),
    };
  }

  /**
   * Map Prisma phone result to Phone type
   */
  private mapPrismaPhoneToPhone(prismaPhone: any): Phone {
    return {
      id: prismaPhone.id,
      brand: prismaPhone.brand.name,
      model: prismaPhone.model,
      variant: prismaPhone.variant || undefined,
      launchDate: prismaPhone.launchDate || new Date(),
      availability: this.mapPrismaAvailabilityToPhoneAvailability(prismaPhone.availability),
      pricing: {
        mrp: prismaPhone.mrp || 0,
        currentPrice: prismaPhone.currentPrice || 0,
        currency: 'INR' as const,
      },
      specifications: this.mapPrismaSpecsToPhoneSpecs(prismaPhone.specifications),
      images: prismaPhone.images || [],
      createdAt: prismaPhone.createdAt,
      updatedAt: prismaPhone.updatedAt,
    };
  }

  /**
   * Map Prisma brand result to Brand type
   */
  private mapPrismaBrandToBrand(prismaBrand: any): Brand {
    return {
      id: prismaBrand.id,
      name: prismaBrand.name,
      logo: prismaBrand.logoUrl || undefined,
      country: undefined, // Not in current schema
      established: undefined, // Not in current schema
    };
  }

  /**
   * Map Prisma availability to PhoneAvailability
   */
  private mapPrismaAvailabilityToPhoneAvailability(availability: string): PhoneAvailability {
    switch (availability) {
      case 'AVAILABLE':
        return 'available';
      case 'DISCONTINUED':
        return 'discontinued';
      case 'UPCOMING':
        return 'upcoming';
      default:
        return 'available';
    }
  }

  /**
   * Map Prisma specifications to PhoneSpecifications
   */
  private mapPrismaSpecsToPhoneSpecs(specs: any): any {
    if (!specs) {
      return {
        display: { size: '', resolution: '', type: '' },
        camera: { rear: [], front: { megapixels: 0, features: [] }, features: [] },
        performance: { processor: '', ram: [], storage: [] },
        battery: { capacity: 0 },
        connectivity: { network: [], wifi: '', bluetooth: '' },
        build: { dimensions: '', weight: '', materials: [], colors: [] },
        software: { os: '', version: '' },
      };
    }

    return {
      display: {
        size: specs.displaySize || '',
        resolution: specs.displayResolution || '',
        type: specs.displayType || '',
        refreshRate: specs.refreshRate || undefined,
        brightness: specs.brightness || undefined,
      },
      camera: {
        rear: this.parseCameraSpecs([
          specs.rearCameraMain,
          specs.rearCameraUltra,
          specs.rearCameraTele,
          specs.rearCameraDepth,
        ].filter(Boolean)),
        front: this.parseCameraSpec(specs.frontCamera),
        features: specs.cameraFeatures || [],
      },
      performance: {
        processor: specs.processor || '',
        gpu: specs.gpu || undefined,
        ram: specs.ramOptions || [],
        storage: specs.storageOptions || [],
        expandableStorage: specs.expandableStorage || false,
      },
      battery: {
        capacity: specs.batteryCapacity || 0,
        chargingSpeed: specs.chargingSpeed || undefined,
        wirelessCharging: specs.wirelessCharging || false,
      },
      connectivity: {
        network: specs.networkSupport || [],
        wifi: specs.wifi || '',
        bluetooth: specs.bluetooth || '',
        nfc: specs.nfc || false,
      },
      build: {
        dimensions: specs.dimensions || '',
        weight: specs.weight || '',
        materials: specs.materials || [],
        colors: specs.colors || [],
        waterResistance: specs.waterResistance || undefined,
      },
      software: {
        os: specs.operatingSystem || '',
        version: specs.osVersion || '',
        updateSupport: specs.updateSupport || undefined,
      },
    };
  }

  /**
   * Parse camera specifications from string array
   */
  private parseCameraSpecs(cameraStrings: string[]): any[] {
    return cameraStrings.map(this.parseCameraSpec);
  }

  /**
   * Parse single camera specification from string
   */
  private parseCameraSpec(cameraString: string | null): any {
    if (!cameraString) {
      return { megapixels: 0, features: [] };
    }

    // Simple parsing - extract megapixels from string like "48MP" or "48 MP"
    const mpMatch = cameraString.match(/(\d+)\s*MP/i);
    const megapixels = mpMatch ? parseInt(mpMatch[1], 10) : 0;

    return {
      megapixels,
      aperture: undefined,
      features: [],
      videoRecording: undefined,
    };
  }
}

// Export singleton instance
export const phoneService = new PhoneService();
