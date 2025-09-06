import { PrismaClient } from '../generated/prisma/index.js'

// Global variable to store the Prisma client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Database connection configuration
const DATABASE_CONFIG = {
  // Connection pool settings
  connectionLimit: 10,
  // Connection timeout in milliseconds
  connectTimeout: 60000,
  // Query timeout in milliseconds
  queryTimeout: 30000,
  // Log levels for development
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] as const : ['error'],
}

/**
 * Creates a new Prisma client instance with optimized configuration
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: DATABASE_CONFIG.log,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

/**
 * Get the Prisma client instance with connection pooling
 * In development, we use a global variable to prevent multiple instances
 * In production, we create a new instance for each serverless function
 */
export const prisma = globalThis.__prisma ?? createPrismaClient()

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

/**
 * Gracefully disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('Database disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}

/**
 * Database transaction wrapper with retry logic
 */
export async function withTransaction<T>(
  operation: (tx: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        timeout: DATABASE_CONFIG.queryTimeout,
        maxWait: DATABASE_CONFIG.connectTimeout,
      })
    } catch (error) {
      lastError = error as Error
      console.warn(`Transaction attempt ${attempt} failed:`, error)
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw lastError || new Error('Transaction failed after maximum retries')
}

/**
 * Database query with retry logic for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if error is retryable (connection issues, timeouts, etc.)
      const isRetryable = isRetryableError(error as Error)
      
      if (!isRetryable || attempt === maxRetries) {
        break
      }
      
      console.warn(`Query attempt ${attempt} failed, retrying:`, error)
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw lastError || new Error('Query failed after maximum retries')
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const retryableErrors = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'P2024', // Prisma connection timeout
    'P2028', // Prisma transaction timeout
  ]
  
  return retryableErrors.some(code => 
    error.message.includes(code) || 
    (error as any).code === code
  )
}

/**
 * Database metrics and monitoring
 */
export class DatabaseMetrics {
  private static queryCount = 0
  private static errorCount = 0
  private static totalQueryTime = 0
  
  static incrementQueryCount(): void {
    this.queryCount++
  }
  
  static incrementErrorCount(): void {
    this.errorCount++
  }
  
  static addQueryTime(time: number): void {
    this.totalQueryTime += time
  }
  
  static getMetrics() {
    return {
      queryCount: this.queryCount,
      errorCount: this.errorCount,
      averageQueryTime: this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
      errorRate: this.queryCount > 0 ? this.errorCount / this.queryCount : 0,
    }
  }
  
  static reset(): void {
    this.queryCount = 0
    this.errorCount = 0
    this.totalQueryTime = 0
  }
}

/**
 * Middleware to track database metrics
 */
export function withMetrics<T>(operation: () => Promise<T>): Promise<T> {
  const startTime = Date.now()
  DatabaseMetrics.incrementQueryCount()
  
  return operation()
    .then(result => {
      DatabaseMetrics.addQueryTime(Date.now() - startTime)
      return result
    })
    .catch(error => {
      DatabaseMetrics.incrementErrorCount()
      DatabaseMetrics.addQueryTime(Date.now() - startTime)
      throw error
    })
}

// Export types for use in other modules
export type { PrismaClient } from '../generated/prisma/index.js'
export * from '../generated/prisma/index.js'