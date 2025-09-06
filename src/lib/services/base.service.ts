import { prisma, withRetry, withMetrics, DatabaseMetrics } from '../database.js'
import type { PrismaClient } from '../database.js'

/**
 * Base service class with common database operations
 */
export abstract class BaseService {
  protected readonly db: PrismaClient

  constructor() {
    this.db = prisma
  }

  /**
   * Execute a database operation with retry logic and metrics
   */
  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    return withMetrics(() => withRetry(operation))
  }

  /**
   * Get database metrics
   */
  public getMetrics() {
    return DatabaseMetrics.getMetrics()
  }

  /**
   * Reset database metrics
   */
  public resetMetrics() {
    DatabaseMetrics.reset()
  }
}

/**
 * Common error types for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier '${identifier}' not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class ConflictError extends DatabaseError {
  constructor(message: string) {
    super(message, 'CONFLICT')
    this.name = 'ConflictError'
  }
}