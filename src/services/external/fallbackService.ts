import { Phone, PhoneSpecifications } from '../../types/phone.js';
import { cacheService } from '../../lib/cache.js';
import { SyncMonitoringService } from './syncMonitoring.js';

// Fallback data source types
export type FallbackSourceType = 'cache' | 'static' | 'alternative_api' | 'manual';

// Fallback configuration
export interface FallbackConfig {
  enableCache: boolean;
  enableStaticData: boolean;
  enableAlternativeApis: boolean;
  cacheExpiryHours: number;
  maxRetries: number;
  retryDelayMs: number;
}

// Fallback result
export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  source: FallbackSourceType;
  error?: string;
  fromCache: boolean;
}

export class FallbackService {
  private config: FallbackConfig;
  private monitoring: SyncMonitoringService;
  private staticPhoneData: Map<string, Partial<Phone>> = new Map();

  constructor(config: FallbackConfig, monitoring: SyncMonitoringService) {
    this.config = config;
    this.monitoring = monitoring;
    this.initializeStaticData();
  }

  /**
   * Get phone data with fallback mechanisms
   */
  async getPhoneDataWithFallback(
    brand: string,
    model: string,
    primaryFetcher: () => Promise<Partial<Phone>>
  ): Promise<FallbackResult<Partial<Phone>>> {
    const phoneKey = `${brand}-${model}`.toLowerCase();

    try {
      // Try primary data source first
      const primaryData = await this.executeWithRetry(primaryFetcher);
      
      if (primaryData) {
        // Cache successful result
        if (this.config.enableCache) {
          await this.cachePhoneData(phoneKey, primaryData);
        }
        
        return {
          success: true,
          data: primaryData,
          source: 'alternative_api',
          fromCache: false,
        };
      }
    } catch (error) {
      this.monitoring.logFallbackActivation(
        'fallback_service',
        `Primary API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'cache_or_static'
      );
    }

    // Try fallback mechanisms in order of preference
    
    // 1. Try cached data
    if (this.config.enableCache) {
      const cachedResult = await this.getCachedPhoneData(phoneKey);
      if (cachedResult.success) {
        return cachedResult;
      }
    }

    // 2. Try static data
    if (this.config.enableStaticData) {
      const staticResult = this.getStaticPhoneData(phoneKey);
      if (staticResult.success) {
        return staticResult;
      }
    }

    // 3. Try alternative APIs (placeholder for future implementation)
    if (this.config.enableAlternativeApis) {
      const alternativeResult = await this.tryAlternativeApis(brand, model);
      if (alternativeResult.success) {
        return alternativeResult;
      }
    }

    // All fallbacks failed
    return {
      success: false,
      source: 'manual',
      error: 'All fallback mechanisms failed',
      fromCache: false,
    };
  }

  /**
   * Get phone specifications with fallback
   */
  async getSpecificationsWithFallback(
    phoneId: string,
    primaryFetcher: () => Promise<PhoneSpecifications>
  ): Promise<FallbackResult<PhoneSpecifications>> {
    try {
      // Try primary data source
      const primarySpecs = await this.executeWithRetry(primaryFetcher);
      
      if (primarySpecs) {
        // Cache successful result
        if (this.config.enableCache) {
          await this.cacheSpecifications(phoneId, primarySpecs);
        }
        
        return {
          success: true,
          data: primarySpecs,
          source: 'alternative_api',
          fromCache: false,
        };
      }
    } catch (error) {
      this.monitoring.logFallbackActivation(
        'fallback_service',
        `Primary specs API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'cache_or_default'
      );
    }

    // Try cached specifications
    if (this.config.enableCache) {
      const cachedSpecs = await this.getCachedSpecifications(phoneId);
      if (cachedSpecs.success) {
        return cachedSpecs;
      }
    }

    // Return default specifications as last resort
    return {
      success: true,
      data: this.getDefaultSpecifications(),
      source: 'static',
      fromCache: false,
    };
  }

  /**
   * Get price data with fallback
   */
  async getPriceDataWithFallback(
    phoneId: string,
    primaryFetcher: () => Promise<{ currentPrice: number; mrp: number }>
  ): Promise<FallbackResult<{ currentPrice: number; mrp: number }>> {
    try {
      // Try primary price source
      const primaryPrice = await this.executeWithRetry(primaryFetcher);
      
      if (primaryPrice && primaryPrice.currentPrice > 0) {
        // Cache successful result
        if (this.config.enableCache) {
          await this.cachePriceData(phoneId, primaryPrice);
        }
        
        return {
          success: true,
          data: primaryPrice,
          source: 'alternative_api',
          fromCache: false,
        };
      }
    } catch (error) {
      this.monitoring.logFallbackActivation(
        'fallback_service',
        `Primary price API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'cache_or_estimate'
      );
    }

    // Try cached price data
    if (this.config.enableCache) {
      const cachedPrice = await this.getCachedPriceData(phoneId);
      if (cachedPrice.success) {
        return cachedPrice;
      }
    }

    // Return estimated price as last resort
    return {
      success: false,
      source: 'manual',
      error: 'No price data available',
      fromCache: false,
    };
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Cache phone data
   */
  private async cachePhoneData(phoneKey: string, phoneData: Partial<Phone>): Promise<void> {
    try {
      const cacheKey = `fallback:phone:${phoneKey}`;
      const expiryMs = this.config.cacheExpiryHours * 60 * 60 * 1000;
      
      await cacheService.set(cacheKey, phoneData, expiryMs);
    } catch (error) {
      console.error('Failed to cache phone data:', error);
    }
  }

  /**
   * Get cached phone data
   */
  private async getCachedPhoneData(phoneKey: string): Promise<FallbackResult<Partial<Phone>>> {
    try {
      const cacheKey = `fallback:phone:${phoneKey}`;
      const cachedData = await cacheService.get<Partial<Phone>>(cacheKey);
      
      if (cachedData) {
        this.monitoring.logFallbackActivation(
          'fallback_service',
          'Primary API unavailable',
          'cache'
        );
        
        return {
          success: true,
          data: cachedData,
          source: 'cache',
          fromCache: true,
        };
      }
    } catch (error) {
      console.error('Failed to get cached phone data:', error);
    }

    return {
      success: false,
      source: 'cache',
      error: 'No cached data available',
      fromCache: false,
    };
  }

  /**
   * Cache specifications
   */
  private async cacheSpecifications(phoneId: string, specs: PhoneSpecifications): Promise<void> {
    try {
      const cacheKey = `fallback:specs:${phoneId}`;
      const expiryMs = this.config.cacheExpiryHours * 60 * 60 * 1000;
      
      await cacheService.set(cacheKey, specs, expiryMs);
    } catch (error) {
      console.error('Failed to cache specifications:', error);
    }
  }

  /**
   * Get cached specifications
   */
  private async getCachedSpecifications(phoneId: string): Promise<FallbackResult<PhoneSpecifications>> {
    try {
      const cacheKey = `fallback:specs:${phoneId}`;
      const cachedSpecs = await cacheService.get<PhoneSpecifications>(cacheKey);
      
      if (cachedSpecs) {
        this.monitoring.logFallbackActivation(
          'fallback_service',
          'Primary specs API unavailable',
          'cache'
        );
        
        return {
          success: true,
          data: cachedSpecs,
          source: 'cache',
          fromCache: true,
        };
      }
    } catch (error) {
      console.error('Failed to get cached specifications:', error);
    }

    return {
      success: false,
      source: 'cache',
      error: 'No cached specifications available',
      fromCache: false,
    };
  }

  /**
   * Cache price data
   */
  private async cachePriceData(phoneId: string, priceData: { currentPrice: number; mrp: number }): Promise<void> {
    try {
      const cacheKey = `fallback:price:${phoneId}`;
      const expiryMs = Math.min(this.config.cacheExpiryHours, 24) * 60 * 60 * 1000; // Max 24 hours for price data
      
      await cacheService.set(cacheKey, priceData, expiryMs);
    } catch (error) {
      console.error('Failed to cache price data:', error);
    }
  }

  /**
   * Get cached price data
   */
  private async getCachedPriceData(phoneId: string): Promise<FallbackResult<{ currentPrice: number; mrp: number }>> {
    try {
      const cacheKey = `fallback:price:${phoneId}`;
      const cachedPrice = await cacheService.get<{ currentPrice: number; mrp: number }>(cacheKey);
      
      if (cachedPrice) {
        this.monitoring.logFallbackActivation(
          'fallback_service',
          'Primary price API unavailable',
          'cache'
        );
        
        return {
          success: true,
          data: cachedPrice,
          source: 'cache',
          fromCache: true,
        };
      }
    } catch (error) {
      console.error('Failed to get cached price data:', error);
    }

    return {
      success: false,
      source: 'cache',
      error: 'No cached price data available',
      fromCache: false,
    };
  }

  /**
   * Get static phone data
   */
  private getStaticPhoneData(phoneKey: string): FallbackResult<Partial<Phone>> {
    const staticData = this.staticPhoneData.get(phoneKey);
    
    if (staticData) {
      this.monitoring.logFallbackActivation(
        'fallback_service',
        'Using static data fallback',
        'static'
      );
      
      return {
        success: true,
        data: staticData,
        source: 'static',
        fromCache: false,
      };
    }

    return {
      success: false,
      source: 'static',
      error: 'No static data available',
      fromCache: false,
    };
  }

  /**
   * Try alternative APIs (placeholder for future implementation)
   */
  private async tryAlternativeApis(brand: string, model: string): Promise<FallbackResult<Partial<Phone>>> {
    // This is a placeholder for future alternative API integrations
    // Could include other phone specification APIs, web scraping, etc.
    
    this.monitoring.logFallbackActivation(
      'fallback_service',
      'Alternative APIs not yet implemented',
      'alternative_api'
    );

    return {
      success: false,
      source: 'alternative_api',
      error: 'Alternative APIs not implemented',
      fromCache: false,
    };
  }

  /**
   * Get default specifications when all else fails
   */
  private getDefaultSpecifications(): PhoneSpecifications {
    return {
      display: {
        size: 'Unknown',
        resolution: 'Unknown',
        type: 'Unknown',
      },
      camera: {
        rear: [],
        front: { megapixels: 0, features: [] },
        features: [],
      },
      performance: {
        processor: 'Unknown',
        ram: [],
        storage: [],
      },
      battery: {
        capacity: 0,
      },
      connectivity: {
        network: [],
        wifi: 'Unknown',
        bluetooth: 'Unknown',
      },
      build: {
        dimensions: 'Unknown',
        weight: 'Unknown',
        materials: [],
        colors: [],
      },
      software: {
        os: 'Unknown',
        version: 'Unknown',
      },
    };
  }

  /**
   * Initialize static phone data for popular models
   */
  private initializeStaticData(): void {
    // Add some popular phone models as static fallback data
    // This would typically be loaded from a JSON file or database
    
    const popularPhones = [
      {
        key: 'apple-iphone-15',
        data: {
          brand: 'Apple',
          model: 'iPhone 15',
          pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' as const },
          availability: 'available' as const,
        },
      },
      {
        key: 'samsung-galaxy-s24',
        data: {
          brand: 'Samsung',
          model: 'Galaxy S24',
          pricing: { mrp: 74999, currentPrice: 74999, currency: 'INR' as const },
          availability: 'available' as const,
        },
      },
      {
        key: 'oneplus-12',
        data: {
          brand: 'OnePlus',
          model: '12',
          pricing: { mrp: 64999, currentPrice: 64999, currency: 'INR' as const },
          availability: 'available' as const,
        },
      },
    ];

    popularPhones.forEach(phone => {
      this.staticPhoneData.set(phone.key, phone.data);
    });
  }

  /**
   * Add static phone data
   */
  addStaticPhoneData(phoneKey: string, phoneData: Partial<Phone>): void {
    this.staticPhoneData.set(phoneKey, phoneData);
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      // Clear fallback-specific cache entries
      const cacheKeys = [
        'fallback:phone:*',
        'fallback:specs:*',
        'fallback:price:*',
      ];

      for (const pattern of cacheKeys) {
        // This would need to be implemented in the cache service
        // await cacheService.deletePattern(pattern);
      }
    } catch (error) {
      console.error('Failed to clear fallback cache:', error);
    }
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats(): {
    staticDataEntries: number;
    cacheHitRate: number;
    fallbackActivations: number;
  } {
    return {
      staticDataEntries: this.staticPhoneData.size,
      cacheHitRate: 0, // Would need to track this
      fallbackActivations: this.monitoring.getMetrics().fallbackActivations,
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}