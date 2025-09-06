import { z } from 'zod';
import { Phone, PhoneSelection, Brand, PhoneModel, PhoneScores } from './phone';
import { ChatContext, AIResponse } from './chat';
import { ComparisonResult, ComparisonInsights } from './comparison';

// AI Service Interface
export interface AIService {
  /**
   * Process a user message and return an AI response
   */
  processUserMessage(message: string, context: ChatContext): Promise<AIResponse>;

  /**
   * Extract phone selection from user message
   */
  extractPhoneSelection(message: string): Promise<PhoneSelection | null>;

  /**
   * Generate comparison insights between two phones
   */
  generateComparison(phone1: Phone, phone2: Phone): Promise<ComparisonResult>;

  /**
   * Generate conversation context based on user preferences
   */
  generateContext(preferences?: any): Promise<Partial<ChatContext>>;
}

// Phone Database Service Interface
export interface PhoneService {
  /**
   * Search phones by query string
   */
  searchPhones(query: string): Promise<Phone[]>;

  /**
   * Get phone by brand and model
   */
  getPhoneByModel(brand: string, model: string): Promise<Phone | null>;

  /**
   * Get phone by ID
   */
  getPhoneById(id: string): Promise<Phone | null>;

  /**
   * Get all available brands
   */
  getAllBrands(): Promise<Brand[]>;

  /**
   * Get models by brand ID
   */
  getModelsByBrand(brandId: string): Promise<PhoneModel[]>;

  /**
   * Update phone data from external sources
   */
  updatePhoneData(): Promise<void>;

  /**
   * Get phones by brand
   */
  getPhonesByBrand(brandName: string): Promise<Phone[]>;

  /**
   * Get similar phones based on specifications
   */
  getSimilarPhones(phone: Phone, limit?: number): Promise<Phone[]>;
}

// Comparison Engine Interface
export interface ComparisonEngine {
  /**
   * Compare two phones and return detailed comparison
   */
  comparePhones(phone1: Phone, phone2: Phone): Promise<ComparisonResult>;

  /**
   * Generate insights from comparison result
   */
  generateInsights(comparison: ComparisonResult): Promise<ComparisonInsights>;

  /**
   * Calculate scores for a phone
   */
  calculateScores(phone: Phone): Promise<PhoneScores>;

  /**
   * Compare multiple phones (more than 2)
   */
  compareMultiplePhones(phones: Phone[]): Promise<ComparisonResult[]>;
}

// Cache Service Interface
export interface CacheService {
  /**
   * Get value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete value from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;

  /**
   * Check if key exists in cache
   */
  exists(key: string): Promise<boolean>;
}

// Database Service Interface
export interface DatabaseService {
  /**
   * Connect to database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from database
   */
  disconnect(): Promise<void>;

  /**
   * Check database health
   */
  healthCheck(): Promise<boolean>;

  /**
   * Run database migrations
   */
  migrate(): Promise<void>;

  /**
   * Seed database with initial data
   */
  seed(): Promise<void>;
}

// External Data Service Interface
export interface ExternalDataService {
  /**
   * Fetch phone data from external APIs
   */
  fetchPhoneData(brand?: string, model?: string): Promise<Phone[]>;

  /**
   * Fetch price data for phones
   */
  fetchPriceData(phoneIds: string[]): Promise<Record<string, number>>;

  /**
   * Sync data with external sources
   */
  syncData(): Promise<void>;

  /**
   * Validate external data
   */
  validateData(data: any): Promise<boolean>;
}

// Service configuration schemas
export const AIServiceConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string().default('gpt-4'),
  maxTokens: z.number().default(2000),
  temperature: z.number().min(0).max(2).default(0.7),
  timeout: z.number().default(30000),
});

export type AIServiceConfig = z.infer<typeof AIServiceConfigSchema>;

export const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  poolSize: z.number().default(10),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export const CacheConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  password: z.string().optional(),
  db: z.number().default(0),
  ttl: z.number().default(3600),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;