import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  checkDatabaseConnection, 
  withTransaction, 
  withRetry, 
  DatabaseMetrics,
  withMetrics 
} from '../database.js'
import { testDb } from './setup.js'

describe('Database Utilities', () => {
  beforeEach(() => {
    DatabaseMetrics.reset()
  })

  describe('checkDatabaseConnection', () => {
    it('should return true for successful connection', async () => {
      const isConnected = await checkDatabaseConnection()
      expect(isConnected).toBe(true)
    })

    it('should return false for failed connection', async () => {
      // Mock a failed query
      const originalQueryRaw = testDb.$queryRaw
      testDb.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection failed'))

      const isConnected = await checkDatabaseConnection()
      expect(isConnected).toBe(false)

      // Restore original method
      testDb.$queryRaw = originalQueryRaw
    })
  })

  describe('withTransaction', () => {
    it('should execute transaction successfully', async () => {
      const result = await withTransaction(async (tx) => {
        const brand = await tx.brand.create({
          data: {
            name: 'Transaction Test Brand',
            slug: 'transaction-test-brand',
          },
        })
        return brand
      })

      expect(result.name).toBe('Transaction Test Brand')
      
      // Verify the brand was actually created
      const brand = await testDb.brand.findUnique({
        where: { slug: 'transaction-test-brand' },
      })
      expect(brand).toBeTruthy()
    })

    it('should rollback transaction on error', async () => {
      await expect(
        withTransaction(async (tx) => {
          await tx.brand.create({
            data: {
              name: 'Transaction Test Brand 2',
              slug: 'transaction-test-brand-2',
            },
          })
          
          // Force an error
          throw new Error('Transaction should rollback')
        })
      ).rejects.toThrow('Transaction should rollback')

      // Verify the brand was not created due to rollback
      const brand = await testDb.brand.findUnique({
        where: { slug: 'transaction-test-brand-2' },
      })
      expect(brand).toBeNull()
    })

    it('should retry failed transactions', async () => {
      let attemptCount = 0
      
      const result = await withTransaction(async (tx) => {
        attemptCount++
        
        if (attemptCount < 2) {
          throw new Error('Temporary failure')
        }
        
        return tx.brand.create({
          data: {
            name: 'Retry Test Brand',
            slug: 'retry-test-brand',
          },
        })
      }, 3)

      expect(attemptCount).toBe(2)
      expect(result.name).toBe('Retry Test Brand')
    })
  })

  describe('withRetry', () => {
    it('should execute operation successfully on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await withRetry(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')
      
      const result = await withRetry(operation, 3)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Non-retryable error'))
      
      await expect(withRetry(operation, 3)).rejects.toThrow('Non-retryable error')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should throw last error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'))
      
      await expect(withRetry(operation, 2)).rejects.toThrow('ETIMEDOUT')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('DatabaseMetrics', () => {
    it('should track query count', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementQueryCount()
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(2)
    })

    it('should track error count', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementErrorCount()
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.errorCount).toBe(1)
      expect(metrics.errorRate).toBe(1) // 1 error out of 1 query
    })

    it('should track query time', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.addQueryTime(100)
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.addQueryTime(200)
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.averageQueryTime).toBe(150) // (100 + 200) / 2
    })

    it('should reset metrics', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementErrorCount()
      DatabaseMetrics.addQueryTime(100)
      
      DatabaseMetrics.reset()
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(0)
      expect(metrics.errorCount).toBe(0)
      expect(metrics.averageQueryTime).toBe(0)
      expect(metrics.errorRate).toBe(0)
    })
  })

  describe('withMetrics', () => {
    it('should track successful operations', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await withMetrics(operation)
      
      expect(result).toBe('success')
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(1)
      expect(metrics.errorCount).toBe(0)
      expect(metrics.averageQueryTime).toBeGreaterThan(0)
    })

    it('should track failed operations', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'))
      
      await expect(withMetrics(operation)).rejects.toThrow('Operation failed')
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(1)
      expect(metrics.errorCount).toBe(1)
      expect(metrics.errorRate).toBe(1)
    })
  })
})