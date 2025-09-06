import { createClient, RedisClientType } from 'redis';
import { env } from './env.js';

// Global variable to store the Redis client instance
declare global {
  // eslint-disable-next-line no-var
  var __redis: RedisClientType | undefined;
}

/**
 * Redis cache configuration
 */
const CACHE_CONFIG = {
  // Default TTL in seconds (1 hour)
  defaultTTL: 3600,
  // Connection timeout in milliseconds
  connectTimeout: 10000,
  // Command timeout in milliseconds
  commandTimeout: 5000,
  // Retry configuration
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

/**
 * Creates a new Redis client instance
 */
function createRedisClient(): RedisClientType {
  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      connectTimeout: CACHE_CONFIG.connectTimeout,
      reconnectStrategy: (retries) => {
        if (retries > CACHE_CONFIG.maxRetriesPerRequest) {
          return new Error('Redis connection failed after maximum retries');
        }
        return Math.min(retries * CACHE_CONFIG.retryDelayOnFailover, 3000);
      },
    },
  }) as RedisClientType;

  // Error handling
  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.on('disconnect', () => {
    console.log('Redis client disconnected');
  });

  return client;
}

/**
 * Get the Redis client instance
 */
export const redis = globalThis.__redis ?? createRedisClient();

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__redis = redis;
}

/**
 * Cache service implementation
 */
export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor(client?: RedisClientType) {
    this.client = client || redis;
  }

  /**
   * Ensure Redis connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw new Error('Cache service unavailable');
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);
      return value ? JSON.parse(value as string) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || CACHE_CONFIG.defaultTTL;
      
      await this.client.setEx(key, expiration, serializedValue);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Don't throw error to prevent cache failures from breaking the app
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.flushAll();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      await this.ensureConnection();
      const values = await this.client.mGet(keys);
      const result: Record<string, T | null> = {};
      
      keys.forEach((key, index) => {
        const value = values[index];
        result[key] = value ? JSON.parse(value as string) : null;
      });
      
      return result;
    } catch (error) {
      console.error('Cache getMany error:', error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMany<T>(entries: Record<string, T>, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      const pipeline = this.client.multi();
      const expiration = ttl || CACHE_CONFIG.defaultTTL;
      
      Object.entries(entries).forEach(([key, value]) => {
        pipeline.setEx(key, expiration, JSON.stringify(value));
      });
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache setMany error:', error);
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.incrBy(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      await this.ensureConnection();
      const info = await this.client.info('memory');
      return { info };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {};
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }
}

/**
 * Default cache service instance
 */
export const cacheService = new CacheService();

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  phone: (id: string) => `phone:${id}`,
  phoneByModel: (brand: string, model: string) => `phone:${brand}:${model}`,
  phonesByBrand: (brand: string) => `phones:brand:${brand}`,
  brands: () => 'brands:all',
  models: (brandId: string) => `models:brand:${brandId}`,
  search: (query: string) => `search:${query}`,
  similarPhones: (phoneId: string) => `similar:${phoneId}`,
  phoneSpecs: (phoneId: string) => `specs:${phoneId}`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;