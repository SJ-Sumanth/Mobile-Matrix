import { prisma } from '../../lib/database.js';
import { cacheService } from '../../lib/cache.js';
import { GSMArenaService, GSMArenaConfig } from './gsmarena.js';
import { PriceTrackingService, PriceTrackingConfig } from './priceTracking.js';
import { Phone, PhoneSchema, Brand } from '../../types/phone.js';
import { z } from 'zod';

// Data sync configuration
export interface DataSyncConfig {
  gsmarena: GSMArenaConfig;
  priceTracking: PriceTrackingConfig;
  syncInterval: number; // in milliseconds
  batchSize: number;
  enabledSources: ('gsmarena' | 'priceTracking')[];
  fallbackEnabled: boolean;
}

// Sync job status
export interface SyncJobStatus {
  id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsCreated: number;
  errors: string[];
}

// Data validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: any;
}

export class DataSyncService {
  private gsmarenaService: GSMArenaService;
  private priceTrackingService: PriceTrackingService;
  private config: DataSyncConfig;
  private activeSyncJobs = new Map<string, SyncJobStatus>();

  constructor(config: DataSyncConfig) {
    this.config = config;
    this.gsmarenaService = new GSMArenaService(config.gsmarena);
    this.priceTrackingService = new PriceTrackingService(config.priceTracking);
  }

  /**
   * Start full data synchronization from all enabled sources
   */
  async startFullSync(): Promise<SyncJobStatus[]> {
    console.log('Starting full data synchronization...');
    const syncJobs: SyncJobStatus[] = [];

    try {
      // Sync phone specifications from GSMArena
      if (this.config.enabledSources.includes('gsmarena')) {
        const gsmarenaJob = await this.syncPhoneSpecifications();
        syncJobs.push(gsmarenaJob);
      }

      // Sync price data
      if (this.config.enabledSources.includes('priceTracking')) {
        const priceJob = await this.syncPriceData();
        syncJobs.push(priceJob);
      }

      // Clear caches after successful sync
      await cacheService.clear();
      
      console.log('Full data synchronization completed');
      return syncJobs;
    } catch (error) {
      console.error('Full data synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Sync phone specifications from GSMArena
   */
  async syncPhoneSpecifications(): Promise<SyncJobStatus> {
    const jobId = `gsmarena-sync-${Date.now()}`;
    const job: SyncJobStatus = {
      id: jobId,
      source: 'gsmarena',
      status: 'running',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsCreated: 0,
      errors: [],
    };

    this.activeSyncJobs.set(jobId, job);

    try {
      console.log('Starting GSMArena phone specifications sync...');

      // Get all brands from our database
      const brands = await prisma.brand.findMany({
        where: { isActive: true },
      });

      for (const brand of brands) {
        try {
          // Get phones from GSMArena for this brand
          const gsmarenaPhones = await this.gsmarenaService.getPhonesByBrand(brand.name);
          
          for (const gsmarenaPhone of gsmarenaPhones) {
            try {
              job.recordsProcessed++;
              
              // Validate and clean the data
              const validationResult = await this.validatePhoneData(gsmarenaPhone);
              if (!validationResult.isValid) {
                job.errors.push(`Validation failed for ${gsmarenaPhone.name}: ${validationResult.errors.join(', ')}`);
                continue;
              }

              // Convert to our phone format
              const phoneData = this.gsmarenaService.convertToPhone(gsmarenaPhone);
              
              // Check if phone already exists
              const existingPhone = await prisma.phone.findFirst({
                where: {
                  brandId: brand.id,
                  model: phoneData.model,
                  variant: phoneData.variant || null,
                },
              });

              if (existingPhone) {
                // Update existing phone
                await this.updatePhoneFromExternalData(existingPhone.id, phoneData);
                job.recordsUpdated++;
              } else {
                // Create new phone
                await this.createPhoneFromExternalData(brand.id, phoneData);
                job.recordsCreated++;
              }

            } catch (error) {
              const errorMsg = `Error processing phone ${gsmarenaPhone.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              job.errors.push(errorMsg);
              console.error(errorMsg);
            }
          }

          // Rate limiting between brands
          await this.delay(1000);

        } catch (error) {
          const errorMsg = `Error syncing brand ${brand.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          job.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      job.status = 'completed';
      job.endTime = new Date();
      console.log(`GSMArena sync completed: ${job.recordsCreated} created, ${job.recordsUpdated} updated, ${job.errors.length} errors`);

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('GSMArena sync failed:', error);
    }

    return job;
  }

  /**
   * Sync price data for all phones
   */
  async syncPriceData(): Promise<SyncJobStatus> {
    const jobId = `price-sync-${Date.now()}`;
    const job: SyncJobStatus = {
      id: jobId,
      source: 'priceTracking',
      status: 'running',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsCreated: 0,
      errors: [],
    };

    this.activeSyncJobs.set(jobId, job);

    try {
      console.log('Starting price data sync...');

      // Get all active phones
      const phones = await prisma.phone.findMany({
        where: { isActive: true },
        include: { brand: true },
      });

      // Process phones in batches
      for (let i = 0; i < phones.length; i += this.config.batchSize) {
        const batch = phones.slice(i, i + this.config.batchSize);
        
        const batchPromises = batch.map(async (phone) => {
          try {
            job.recordsProcessed++;
            
            // Get price data from external service
            const priceData = await this.priceTrackingService.getPhonePrices(
              phone.brand.name,
              phone.model,
              phone.variant || undefined
            );

            if (priceData) {
              // Filter for Indian retailers only
              const indianPriceData = this.priceTrackingService.filterIndianRetailers(priceData);
              
              if (indianPriceData.prices.length > 0) {
                // Update phone pricing
                await prisma.phone.update({
                  where: { id: phone.id },
                  data: {
                    currentPrice: indianPriceData.lowestPrice,
                    updatedAt: new Date(),
                  },
                });

                job.recordsUpdated++;
              }
            }

          } catch (error) {
            const errorMsg = `Error updating price for ${phone.brand.name} ${phone.model}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            job.errors.push(errorMsg);
            console.error(errorMsg);
          }
        });

        await Promise.all(batchPromises);
        
        // Rate limiting between batches
        if (i + this.config.batchSize < phones.length) {
          await this.delay(2000);
        }
      }

      job.status = 'completed';
      job.endTime = new Date();
      console.log(`Price sync completed: ${job.recordsUpdated} updated, ${job.errors.length} errors`);

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.errors.push(`Price sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Price sync failed:', error);
    }

    return job;
  }

  /**
   * Sync data for a specific phone
   */
  async syncPhoneData(phoneId: string): Promise<boolean> {
    try {
      const phone = await prisma.phone.findUnique({
        where: { id: phoneId },
        include: { brand: true },
      });

      if (!phone) {
        throw new Error(`Phone with ID ${phoneId} not found`);
      }

      // Sync specifications from GSMArena
      if (this.config.enabledSources.includes('gsmarena')) {
        try {
          const gsmarenaPhones = await this.gsmarenaService.searchPhones(`${phone.brand.name} ${phone.model}`);
          const matchingPhone = gsmarenaPhones.find(p => 
            p.brand.toLowerCase() === phone.brand.name.toLowerCase() &&
            p.model.toLowerCase() === phone.model.toLowerCase()
          );

          if (matchingPhone) {
            const phoneData = this.gsmarenaService.convertToPhone(matchingPhone);
            await this.updatePhoneFromExternalData(phoneId, phoneData);
          }
        } catch (error) {
          console.error(`Error syncing specifications for phone ${phoneId}:`, error);
        }
      }

      // Sync price data
      if (this.config.enabledSources.includes('priceTracking')) {
        try {
          const priceData = await this.priceTrackingService.getPhonePrices(
            phone.brand.name,
            phone.model,
            phone.variant || undefined
          );

          if (priceData) {
            const indianPriceData = this.priceTrackingService.filterIndianRetailers(priceData);
            
            if (indianPriceData.prices.length > 0) {
              await prisma.phone.update({
                where: { id: phoneId },
                data: {
                  currentPrice: indianPriceData.lowestPrice,
                  updatedAt: new Date(),
                },
              });
            }
          }
        } catch (error) {
          console.error(`Error syncing price for phone ${phoneId}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error(`Error syncing phone data for ${phoneId}:`, error);
      return false;
    }
  }

  /**
   * Get sync job status
   */
  getSyncJobStatus(jobId: string): SyncJobStatus | null {
    return this.activeSyncJobs.get(jobId) || null;
  }

  /**
   * Get all active sync jobs
   */
  getActiveSyncJobs(): SyncJobStatus[] {
    return Array.from(this.activeSyncJobs.values());
  }

  /**
   * Validate phone data from external sources
   */
  private async validatePhoneData(phoneData: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Basic required fields validation
      if (!phoneData.brand || typeof phoneData.brand !== 'string') {
        result.errors.push('Brand is required and must be a string');
      }

      if (!phoneData.model || typeof phoneData.model !== 'string') {
        result.errors.push('Model is required and must be a string');
      }

      // Validate specifications if present
      if (phoneData.specifications) {
        if (phoneData.specifications.display) {
          if (phoneData.specifications.display.size && !/^\d+\.?\d*"?$/.test(phoneData.specifications.display.size)) {
            result.warnings.push('Display size format may be invalid');
          }
        }

        if (phoneData.specifications.battery) {
          if (phoneData.specifications.battery.capacity && phoneData.specifications.battery.capacity < 1000) {
            result.warnings.push('Battery capacity seems unusually low');
          }
        }
      }

      // Validate price data
      if (phoneData.price) {
        if (phoneData.price.price && (phoneData.price.price < 1000 || phoneData.price.price > 500000)) {
          result.warnings.push('Price seems outside normal range for Indian market');
        }
      }

      result.isValid = result.errors.length === 0;
      
      // Clean the data
      result.cleanedData = this.cleanPhoneData(phoneData);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Clean and sanitize phone data
   */
  private cleanPhoneData(phoneData: any): any {
    const cleaned = { ...phoneData };

    // Clean string fields
    if (cleaned.brand) cleaned.brand = cleaned.brand.trim();
    if (cleaned.model) cleaned.model = cleaned.model.trim();
    if (cleaned.variant) cleaned.variant = cleaned.variant.trim();

    // Clean arrays
    if (cleaned.images && Array.isArray(cleaned.images)) {
      cleaned.images = cleaned.images.filter((img: any) => img && typeof img === 'string' && img.trim().length > 0);
    }

    // Clean specifications
    if (cleaned.specifications) {
      // Clean camera features
      if (cleaned.specifications.camera?.features) {
        cleaned.specifications.camera.features = cleaned.specifications.camera.features.filter(
          (feature: any) => feature && typeof feature === 'string' && feature.trim().length > 0
        );
      }

      // Clean connectivity networks
      if (cleaned.specifications.connectivity?.network) {
        cleaned.specifications.connectivity.network = cleaned.specifications.connectivity.network.filter(
          (network: any) => network && typeof network === 'string' && network.trim().length > 0
        );
      }
    }

    return cleaned;
  }

  /**
   * Create new phone from external data
   */
  private async createPhoneFromExternalData(brandId: string, phoneData: Partial<Phone>): Promise<void> {
    const slug = this.generateSlug(phoneData.brand || '', phoneData.model || '', phoneData.variant);
    
    const phone = await prisma.phone.create({
      data: {
        brandId,
        model: phoneData.model || '',
        variant: phoneData.variant,
        slug,
        launchDate: phoneData.launchDate,
        availability: this.mapAvailabilityToPrisma(phoneData.availability || 'available'),
        mrp: phoneData.pricing?.mrp,
        currentPrice: phoneData.pricing?.currentPrice,
        currency: phoneData.pricing?.currency || 'INR',
        images: phoneData.images || [],
      },
    });

    // Create specifications if available
    if (phoneData.specifications) {
      await this.createPhoneSpecifications(phone.id, phoneData.specifications);
    }
  }

  /**
   * Update existing phone from external data
   */
  private async updatePhoneFromExternalData(phoneId: string, phoneData: Partial<Phone>): Promise<void> {
    await prisma.phone.update({
      where: { id: phoneId },
      data: {
        launchDate: phoneData.launchDate,
        availability: phoneData.availability ? this.mapAvailabilityToPrisma(phoneData.availability) : undefined,
        mrp: phoneData.pricing?.mrp,
        currentPrice: phoneData.pricing?.currentPrice,
        images: phoneData.images,
        updatedAt: new Date(),
      },
    });

    // Update specifications if available
    if (phoneData.specifications) {
      await this.updatePhoneSpecifications(phoneId, phoneData.specifications);
    }
  }

  /**
   * Create phone specifications
   */
  private async createPhoneSpecifications(phoneId: string, specs: any): Promise<void> {
    await prisma.phoneSpecification.create({
      data: {
        phoneId,
        displaySize: specs.display?.size,
        displayResolution: specs.display?.resolution,
        displayType: specs.display?.type,
        refreshRate: specs.display?.refreshRate,
        brightness: specs.display?.brightness,
        rearCameraMain: specs.camera?.rear?.[0] ? this.formatCameraSpec(specs.camera.rear[0]) : undefined,
        rearCameraUltra: specs.camera?.rear?.[1] ? this.formatCameraSpec(specs.camera.rear[1]) : undefined,
        rearCameraTele: specs.camera?.rear?.[2] ? this.formatCameraSpec(specs.camera.rear[2]) : undefined,
        rearCameraDepth: specs.camera?.rear?.[3] ? this.formatCameraSpec(specs.camera.rear[3]) : undefined,
        frontCamera: specs.camera?.front ? this.formatCameraSpec(specs.camera.front) : undefined,
        cameraFeatures: specs.camera?.features || [],
        processor: specs.performance?.processor,
        gpu: specs.performance?.gpu,
        ramOptions: specs.performance?.ram || [],
        storageOptions: specs.performance?.storage || [],
        expandableStorage: specs.performance?.expandableStorage || false,
        batteryCapacity: specs.battery?.capacity,
        chargingSpeed: specs.battery?.chargingSpeed,
        wirelessCharging: specs.battery?.wirelessCharging || false,
        networkSupport: specs.connectivity?.network || [],
        wifi: specs.connectivity?.wifi,
        bluetooth: specs.connectivity?.bluetooth,
        nfc: specs.connectivity?.nfc || false,
        dimensions: specs.build?.dimensions,
        weight: specs.build?.weight,
        materials: specs.build?.materials || [],
        colors: specs.build?.colors || [],
        waterResistance: specs.build?.waterResistance,
        operatingSystem: specs.software?.os,
        osVersion: specs.software?.version,
        updateSupport: specs.software?.updateSupport,
      },
    });
  }

  /**
   * Update phone specifications
   */
  private async updatePhoneSpecifications(phoneId: string, specs: any): Promise<void> {
    await prisma.phoneSpecification.upsert({
      where: { phoneId },
      create: {
        phoneId,
        displaySize: specs.display?.size,
        displayResolution: specs.display?.resolution,
        displayType: specs.display?.type,
        refreshRate: specs.display?.refreshRate,
        brightness: specs.display?.brightness,
        rearCameraMain: specs.camera?.rear?.[0] ? this.formatCameraSpec(specs.camera.rear[0]) : undefined,
        rearCameraUltra: specs.camera?.rear?.[1] ? this.formatCameraSpec(specs.camera.rear[1]) : undefined,
        rearCameraTele: specs.camera?.rear?.[2] ? this.formatCameraSpec(specs.camera.rear[2]) : undefined,
        rearCameraDepth: specs.camera?.rear?.[3] ? this.formatCameraSpec(specs.camera.rear[3]) : undefined,
        frontCamera: specs.camera?.front ? this.formatCameraSpec(specs.camera.front) : undefined,
        cameraFeatures: specs.camera?.features || [],
        processor: specs.performance?.processor,
        gpu: specs.performance?.gpu,
        ramOptions: specs.performance?.ram || [],
        storageOptions: specs.performance?.storage || [],
        expandableStorage: specs.performance?.expandableStorage || false,
        batteryCapacity: specs.battery?.capacity,
        chargingSpeed: specs.battery?.chargingSpeed,
        wirelessCharging: specs.battery?.wirelessCharging || false,
        networkSupport: specs.connectivity?.network || [],
        wifi: specs.connectivity?.wifi,
        bluetooth: specs.connectivity?.bluetooth,
        nfc: specs.connectivity?.nfc || false,
        dimensions: specs.build?.dimensions,
        weight: specs.build?.weight,
        materials: specs.build?.materials || [],
        colors: specs.build?.colors || [],
        waterResistance: specs.build?.waterResistance,
        operatingSystem: specs.software?.os,
        osVersion: specs.software?.version,
        updateSupport: specs.software?.updateSupport,
      },
      update: {
        displaySize: specs.display?.size,
        displayResolution: specs.display?.resolution,
        displayType: specs.display?.type,
        refreshRate: specs.display?.refreshRate,
        brightness: specs.display?.brightness,
        rearCameraMain: specs.camera?.rear?.[0] ? this.formatCameraSpec(specs.camera.rear[0]) : undefined,
        rearCameraUltra: specs.camera?.rear?.[1] ? this.formatCameraSpec(specs.camera.rear[1]) : undefined,
        rearCameraTele: specs.camera?.rear?.[2] ? this.formatCameraSpec(specs.camera.rear[2]) : undefined,
        rearCameraDepth: specs.camera?.rear?.[3] ? this.formatCameraSpec(specs.camera.rear[3]) : undefined,
        frontCamera: specs.camera?.front ? this.formatCameraSpec(specs.camera.front) : undefined,
        cameraFeatures: specs.camera?.features || [],
        processor: specs.performance?.processor,
        gpu: specs.performance?.gpu,
        ramOptions: specs.performance?.ram || [],
        storageOptions: specs.performance?.storage || [],
        expandableStorage: specs.performance?.expandableStorage || false,
        batteryCapacity: specs.battery?.capacity,
        chargingSpeed: specs.battery?.chargingSpeed,
        wirelessCharging: specs.battery?.wirelessCharging || false,
        networkSupport: specs.connectivity?.network || [],
        wifi: specs.connectivity?.wifi,
        bluetooth: specs.connectivity?.bluetooth,
        nfc: specs.connectivity?.nfc || false,
        dimensions: specs.build?.dimensions,
        weight: specs.build?.weight,
        materials: specs.build?.materials || [],
        colors: specs.build?.colors || [],
        waterResistance: specs.build?.waterResistance,
        operatingSystem: specs.software?.os,
        osVersion: specs.software?.version,
        updateSupport: specs.software?.updateSupport,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Utility methods
   */
  private generateSlug(brand: string, model: string, variant?: string): string {
    let slug = `${brand}-${model}`;
    if (variant) {
      slug += `-${variant}`;
    }
    return slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private mapAvailabilityToPrisma(availability: string): 'AVAILABLE' | 'DISCONTINUED' | 'UPCOMING' {
    switch (availability) {
      case 'available':
        return 'AVAILABLE';
      case 'discontinued':
        return 'DISCONTINUED';
      case 'upcoming':
        return 'UPCOMING';
      default:
        return 'AVAILABLE';
    }
  }

  private formatCameraSpec(cameraSpec: any): string {
    if (typeof cameraSpec === 'string') {
      return cameraSpec;
    }
    
    if (cameraSpec.megapixels) {
      let spec = `${cameraSpec.megapixels}MP`;
      if (cameraSpec.aperture) {
        spec += ` ${cameraSpec.aperture}`;
      }
      return spec;
    }
    
    return '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}