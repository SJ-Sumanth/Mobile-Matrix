import { DataSyncService, DataSyncConfig } from './dataSyncService.js';
import { SyncMonitoringService } from './syncMonitoring.js';
import { FallbackService, FallbackConfig } from './fallbackService.js';
import { GSMArenaService, GSMArenaConfig } from './gsmarena.js';
import { PriceTrackingService, PriceTrackingConfig } from './priceTracking.js';

// Main external data integration configuration
export interface ExternalDataConfig {
  gsmarena: GSMArenaConfig;
  priceTracking: PriceTrackingConfig;
  dataSync: Omit<DataSyncConfig, 'gsmarena' | 'priceTracking'>;
  fallback: FallbackConfig;
  monitoring: {
    enabled: boolean;
    errorThreshold: number;
    rateLimitThreshold: number;
    syncFailureThreshold: number;
    webhookUrl?: string;
    emailRecipients?: string[];
  };
}

// Default configuration
export const defaultExternalDataConfig: ExternalDataConfig = {
  gsmarena: {
    apiKey: process.env.GSMARENA_API_KEY || '',
    baseUrl: 'https://api.gsmarena.com/v1',
    timeout: 30000,
    retryAttempts: 3,
  },
  priceTracking: {
    apiKey: process.env.PRICE_TRACKING_API_KEY || '',
    baseUrl: 'https://api.pricetracking.com/v1',
    timeout: 30000,
    retryAttempts: 3,
    enabledRetailers: ['amazon', 'flipkart', 'croma', 'reliance'],
  },
  dataSync: {
    syncInterval: 24 * 60 * 60 * 1000, // 24 hours
    batchSize: 10,
    enabledSources: ['gsmarena', 'priceTracking'],
    fallbackEnabled: true,
  },
  fallback: {
    enableCache: true,
    enableStaticData: true,
    enableAlternativeApis: false,
    cacheExpiryHours: 48,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  monitoring: {
    enabled: true,
    errorThreshold: 10,
    rateLimitThreshold: 5,
    syncFailureThreshold: 3,
  },
};

/**
 * Main external data integration service
 * Orchestrates all external data sources, monitoring, and fallbacks
 */
export class ExternalDataIntegrationService {
  private config: ExternalDataConfig;
  private monitoring: SyncMonitoringService;
  private fallbackService: FallbackService;
  private dataSyncService: DataSyncService;
  private gsmarenaService: GSMArenaService;
  private priceTrackingService: PriceTrackingService;
  private syncInterval?: NodeJS.Timeout;

  constructor(config: Partial<ExternalDataConfig> = {}) {
    this.config = { ...defaultExternalDataConfig, ...config };
    
    // Initialize monitoring service
    this.monitoring = new SyncMonitoringService({
      enabled: this.config.monitoring.enabled,
      errorThreshold: this.config.monitoring.errorThreshold,
      rateLimitThreshold: this.config.monitoring.rateLimitThreshold,
      syncFailureThreshold: this.config.monitoring.syncFailureThreshold,
      webhookUrl: this.config.monitoring.webhookUrl,
      emailRecipients: this.config.monitoring.emailRecipients,
    });

    // Initialize fallback service
    this.fallbackService = new FallbackService(this.config.fallback, this.monitoring);

    // Initialize individual services
    this.gsmarenaService = new GSMArenaService(this.config.gsmarena);
    this.priceTrackingService = new PriceTrackingService(this.config.priceTracking);

    // Initialize data sync service
    this.dataSyncService = new DataSyncService({
      ...this.config.dataSync,
      gsmarena: this.config.gsmarena,
      priceTracking: this.config.priceTracking,
    });
  }

  /**
   * Initialize the external data integration service
   */
  async initialize(): Promise<void> {
    console.log('Initializing External Data Integration Service...');
    
    try {
      // Test API connections
      await this.testConnections();
      
      // Start automatic sync if configured
      if (this.config.dataSync.syncInterval > 0) {
        this.startAutomaticSync();
      }
      
      this.monitoring.logEvent('sync_started', 'external_data_service', {
        message: 'External data integration service initialized successfully',
      });
      
      console.log('External Data Integration Service initialized successfully');
    } catch (error) {
      this.monitoring.logEvent('sync_failed', 'external_data_service', undefined, 
        `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Start automatic data synchronization
   */
  startAutomaticSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.performFullSync();
      } catch (error) {
        console.error('Automatic sync failed:', error);
      }
    }, this.config.dataSync.syncInterval);

    console.log(`Automatic sync started with interval: ${this.config.dataSync.syncInterval}ms`);
  }

  /**
   * Stop automatic data synchronization
   */
  stopAutomaticSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('Automatic sync stopped');
    }
  }

  /**
   * Perform full data synchronization
   */
  async performFullSync(): Promise<void> {
    const startTime = Date.now();
    this.monitoring.logSyncStart('full_sync');

    try {
      const syncJobs = await this.dataSyncService.startFullSync();
      
      const duration = Date.now() - startTime;
      const successfulJobs = syncJobs.filter(job => job.status === 'completed').length;
      const failedJobs = syncJobs.filter(job => job.status === 'failed').length;

      this.monitoring.logSyncComplete('full_sync', duration, {
        totalJobs: syncJobs.length,
        successfulJobs,
        failedJobs,
        jobs: syncJobs.map(job => ({
          source: job.source,
          status: job.status,
          recordsProcessed: job.recordsProcessed,
          recordsUpdated: job.recordsUpdated,
          recordsCreated: job.recordsCreated,
          errors: job.errors.length,
        })),
      });

      if (failedJobs > 0) {
        throw new Error(`${failedJobs} sync jobs failed`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.logSyncFailure('full_sync', 
        error instanceof Error ? error.message : 'Unknown error', 
        duration
      );
      throw error;
    }
  }

  /**
   * Sync data for a specific phone
   */
  async syncPhoneData(phoneId: string): Promise<boolean> {
    const startTime = Date.now();
    this.monitoring.logSyncStart('phone_sync', { phoneId });

    try {
      const success = await this.dataSyncService.syncPhoneData(phoneId);
      
      const duration = Date.now() - startTime;
      if (success) {
        this.monitoring.logSyncComplete('phone_sync', duration, { phoneId });
      } else {
        this.monitoring.logSyncFailure('phone_sync', 'Sync returned false', duration, { phoneId });
      }

      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitoring.logSyncFailure('phone_sync', 
        error instanceof Error ? error.message : 'Unknown error', 
        duration, 
        { phoneId }
      );
      return false;
    }
  }

  /**
   * Get phone data with fallback support
   */
  async getPhoneData(brand: string, model: string): Promise<any> {
    return await this.fallbackService.getPhoneDataWithFallback(
      brand,
      model,
      async () => {
        const phones = await this.gsmarenaService.searchPhones(`${brand} ${model}`);
        const matchingPhone = phones.find(p => 
          p.brand.toLowerCase() === brand.toLowerCase() &&
          p.model.toLowerCase() === model.toLowerCase()
        );
        
        if (matchingPhone) {
          return this.gsmarenaService.convertToPhone(matchingPhone);
        }
        
        return null;
      }
    );
  }

  /**
   * Get price data with fallback support
   */
  async getPriceData(brand: string, model: string, variant?: string): Promise<any> {
    return await this.fallbackService.getPriceDataWithFallback(
      `${brand}-${model}`,
      async () => {
        const priceData = await this.priceTrackingService.getPhonePrices(brand, model, variant);
        
        if (priceData) {
          const indianPriceData = this.priceTrackingService.filterIndianRetailers(priceData);
          return {
            currentPrice: indianPriceData.lowestPrice,
            mrp: indianPriceData.averagePrice,
          };
        }
        
        return null;
      }
    );
  }

  /**
   * Search phones across all sources with fallback
   */
  async searchPhones(query: string): Promise<any[]> {
    try {
      // Try GSMArena first
      const gsmarenaResults = await this.gsmarenaService.searchPhones(query);
      return gsmarenaResults.map(phone => this.gsmarenaService.convertToPhone(phone));
    } catch (error) {
      this.monitoring.logApiError('gsmarena', 'search', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Fallback to cached or static data would go here
      return [];
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): any {
    const healthReport = this.monitoring.generateHealthReport();
    const fallbackStats = this.fallbackService.getFallbackStats();
    
    return {
      ...healthReport,
      fallback: fallbackStats,
      services: {
        gsmarena: {
          configured: !!this.config.gsmarena.apiKey,
          enabled: this.config.dataSync.enabledSources.includes('gsmarena'),
        },
        priceTracking: {
          configured: !!this.config.priceTracking.apiKey,
          enabled: this.config.dataSync.enabledSources.includes('priceTracking'),
        },
      },
      automaticSync: {
        enabled: !!this.syncInterval,
        interval: this.config.dataSync.syncInterval,
      },
    };
  }

  /**
   * Get monitoring metrics
   */
  getMetrics(): any {
    return this.monitoring.getMetrics();
  }

  /**
   * Get recent events
   */
  getRecentEvents(hours = 24): any[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.monitoring.getEvents(undefined, undefined, cutoffTime);
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await this.fallbackService.clearCache();
  }

  /**
   * Test connections to external APIs
   */
  private async testConnections(): Promise<void> {
    const tests: Promise<void>[] = [];

    // Test GSMArena connection if enabled
    if (this.config.dataSync.enabledSources.includes('gsmarena') && this.config.gsmarena.apiKey) {
      tests.push(this.testGSMArenaConnection());
    }

    // Test price tracking connection if enabled
    if (this.config.dataSync.enabledSources.includes('priceTracking') && this.config.priceTracking.apiKey) {
      tests.push(this.testPriceTrackingConnection());
    }

    await Promise.all(tests);
  }

  /**
   * Test GSMArena API connection
   */
  private async testGSMArenaConnection(): Promise<void> {
    try {
      await this.gsmarenaService.getBrands();
      console.log('✅ GSMArena API connection successful');
    } catch (error) {
      console.error('❌ GSMArena API connection failed:', error);
      throw new Error('GSMArena API connection test failed');
    }
  }

  /**
   * Test price tracking API connection
   */
  private async testPriceTrackingConnection(): Promise<void> {
    try {
      // Test with a simple query
      await this.priceTrackingService.getPhonePrices('Apple', 'iPhone');
      console.log('✅ Price tracking API connection successful');
    } catch (error) {
      console.error('❌ Price tracking API connection failed:', error);
      throw new Error('Price tracking API connection test failed');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopAutomaticSync();
    console.log('External Data Integration Service cleaned up');
  }
}

// Export individual services for direct use if needed
export {
  DataSyncService,
  SyncMonitoringService,
  FallbackService,
  GSMArenaService,
  PriceTrackingService,
};

// Export types
export type {
  ExternalDataConfig,
  DataSyncConfig,
  FallbackConfig,
  GSMArenaConfig,
  PriceTrackingConfig,
};

// Create and export singleton instance
export const externalDataService = new ExternalDataIntegrationService();