import { z } from 'zod';

// Price tracking API response schemas
const PriceDataSchema = z.object({
  phoneId: z.string(),
  brand: z.string(),
  model: z.string(),
  variant: z.string().optional(),
  prices: z.array(z.object({
    retailer: z.string(),
    price: z.number(),
    currency: z.string(),
    availability: z.enum(['in_stock', 'out_of_stock', 'pre_order']),
    url: z.string().url(),
    lastUpdated: z.string(),
  })),
  averagePrice: z.number(),
  lowestPrice: z.number(),
  highestPrice: z.number(),
  priceHistory: z.array(z.object({
    date: z.string(),
    price: z.number(),
    retailer: z.string(),
  })).optional(),
});

const IndianRetailerSchema = z.object({
  name: z.string(),
  url: z.string(),
  isActive: z.boolean(),
  priority: z.number(), // Higher priority retailers are checked first
});

type PriceData = z.infer<typeof PriceDataSchema>;
type IndianRetailer = z.infer<typeof IndianRetailerSchema>;

export interface PriceTrackingConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  enabledRetailers: string[];
}

export class PriceTrackingService {
  private config: PriceTrackingConfig;
  private rateLimitDelay = 2000; // 2 seconds between requests for price APIs

  // Major Indian phone retailers
  private indianRetailers: IndianRetailer[] = [
    { name: 'Amazon India', url: 'amazon.in', isActive: true, priority: 10 },
    { name: 'Flipkart', url: 'flipkart.com', isActive: true, priority: 9 },
    { name: 'Myntra', url: 'myntra.com', isActive: true, priority: 8 },
    { name: 'Croma', url: 'croma.com', isActive: true, priority: 7 },
    { name: 'Reliance Digital', url: 'reliancedigital.in', isActive: true, priority: 6 },
    { name: 'Vijay Sales', url: 'vijaysales.com', isActive: true, priority: 5 },
    { name: 'Poorvika Mobiles', url: 'poorvika.com', isActive: true, priority: 4 },
    { name: 'Sangeetha Mobiles', url: 'sangeethastores.com', isActive: true, priority: 3 },
  ];

  constructor(config: PriceTrackingConfig) {
    this.config = config;
  }

  /**
   * Get current prices for a phone across Indian retailers
   */
  async getPhonePrices(brand: string, model: string, variant?: string): Promise<PriceData | null> {
    try {
      const query = this.buildSearchQuery(brand, model, variant);
      const response = await this.makeRequest(`/prices/search?q=${encodeURIComponent(query)}&country=IN`);
      const data = await response.json();

      if (!data.priceData) {
        return null;
      }

      return this.validateAndParsePriceData(data.priceData);
    } catch (error) {
      console.error(`Error getting prices for ${brand} ${model}:`, error);
      return null;
    }
  }

  /**
   * Get price history for a phone
   */
  async getPriceHistory(phoneId: string, days = 30): Promise<PriceData['priceHistory']> {
    try {
      const response = await this.makeRequest(`/prices/${phoneId}/history?days=${days}&country=IN`);
      const data = await response.json();

      if (!Array.isArray(data.history)) {
        return [];
      }

      return data.history.map((entry: any) => ({
        date: entry.date,
        price: entry.price,
        retailer: entry.retailer,
      }));
    } catch (error) {
      console.error(`Error getting price history for phone ${phoneId}:`, error);
      return [];
    }
  }

  /**
   * Track price changes for multiple phones
   */
  async trackPriceChanges(phoneIds: string[]): Promise<Map<string, PriceData>> {
    const priceMap = new Map<string, PriceData>();
    
    // Process phones in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < phoneIds.length; i += batchSize) {
      const batch = phoneIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (phoneId) => {
        try {
          const response = await this.makeRequest(`/prices/${phoneId}?country=IN`);
          const data = await response.json();
          
          if (data.priceData) {
            const priceData = this.validateAndParsePriceData(data.priceData);
            priceMap.set(phoneId, priceData);
          }
        } catch (error) {
          console.error(`Error tracking price for phone ${phoneId}:`, error);
        }
      });

      await Promise.all(batchPromises);
      
      // Rate limiting between batches
      if (i + batchSize < phoneIds.length) {
        await this.delay(this.rateLimitDelay);
      }
    }

    return priceMap;
  }

  /**
   * Get best deals for phones under a certain price range
   */
  async getBestDeals(maxPrice: number, category?: string): Promise<PriceData[]> {
    try {
      const params = new URLSearchParams({
        maxPrice: maxPrice.toString(),
        country: 'IN',
        sortBy: 'discount',
      });

      if (category) {
        params.append('category', category);
      }

      const response = await this.makeRequest(`/deals?${params.toString()}`);
      const data = await response.json();

      if (!Array.isArray(data.deals)) {
        return [];
      }

      return data.deals.map((deal: any) => this.validateAndParsePriceData(deal));
    } catch (error) {
      console.error('Error getting best deals:', error);
      return [];
    }
  }

  /**
   * Get price alerts for significant price drops
   */
  async getPriceAlerts(threshold = 10): Promise<Array<{ phoneId: string; oldPrice: number; newPrice: number; discount: number }>> {
    try {
      const response = await this.makeRequest(`/alerts?threshold=${threshold}&country=IN`);
      const data = await response.json();

      if (!Array.isArray(data.alerts)) {
        return [];
      }

      return data.alerts.map((alert: any) => ({
        phoneId: alert.phoneId,
        oldPrice: alert.oldPrice,
        newPrice: alert.newPrice,
        discount: alert.discount,
      }));
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    }
  }

  /**
   * Calculate price statistics for a phone
   */
  calculatePriceStats(priceData: PriceData): {
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
    priceRange: number;
    bestDeal: PriceData['prices'][0] | null;
  } {
    const prices = priceData.prices.filter(p => p.availability === 'in_stock');
    
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        lowestPrice: 0,
        highestPrice: 0,
        priceRange: 0,
        bestDeal: null,
      };
    }

    const priceValues = prices.map(p => p.price);
    const lowestPrice = Math.min(...priceValues);
    const highestPrice = Math.max(...priceValues);
    const averagePrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const bestDeal = prices.find(p => p.price === lowestPrice) || null;

    return {
      averagePrice: Math.round(averagePrice),
      lowestPrice,
      highestPrice,
      priceRange: highestPrice - lowestPrice,
      bestDeal,
    };
  }

  /**
   * Filter prices by Indian retailers only
   */
  filterIndianRetailers(priceData: PriceData): PriceData {
    const indianRetailerNames = this.indianRetailers
      .filter(r => r.isActive)
      .map(r => r.name.toLowerCase());

    const filteredPrices = priceData.prices.filter(price => 
      indianRetailerNames.some(retailer => 
        price.retailer.toLowerCase().includes(retailer) ||
        price.url.includes(retailer)
      )
    );

    const stats = this.calculatePriceStats({ ...priceData, prices: filteredPrices });

    return {
      ...priceData,
      prices: filteredPrices,
      averagePrice: stats.averagePrice,
      lowestPrice: stats.lowestPrice,
      highestPrice: stats.highestPrice,
    };
  }

  /**
   * Make HTTP request to price tracking API with retry logic
   */
  private async makeRequest(endpoint: string): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Rate limiting
        if (attempt > 1) {
          await this.delay(this.rateLimitDelay * attempt);
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MobileMatrix/1.0',
          },
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Price tracking API request attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === this.config.retryAttempts) {
          break;
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Validate and parse price data
   */
  private validateAndParsePriceData(priceData: any): PriceData {
    try {
      return PriceDataSchema.parse(priceData);
    } catch (error) {
      console.error('Invalid price data:', error);
      throw new Error('Invalid price data format');
    }
  }

  /**
   * Build search query for price tracking
   */
  private buildSearchQuery(brand: string, model: string, variant?: string): string {
    let query = `${brand} ${model}`;
    if (variant) {
      query += ` ${variant}`;
    }
    return query.trim();
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}