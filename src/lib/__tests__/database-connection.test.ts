import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatabaseMetrics, withMetrics } from '../database.js'

describe('Database Connection Utilities (Unit Tests)', () => {
  beforeEach(() => {
    DatabaseMetrics.reset()
  })

  describe('DatabaseMetrics', () => {
    it('should track query count correctly', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementQueryCount()
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(3)
    })

    it('should track error count correctly', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.incrementErrorCount()
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(2)
      expect(metrics.errorCount).toBe(1)
      expect(metrics.errorRate).toBe(0.5) // 1 error out of 2 queries
    })

    it('should calculate average query time correctly', () => {
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.addQueryTime(100)
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.addQueryTime(200)
      DatabaseMetrics.incrementQueryCount()
      DatabaseMetrics.addQueryTime(300)
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.averageQueryTime).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should handle zero queries gracefully', () => {
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(0)
      expect(metrics.errorCount).toBe(0)
      expect(metrics.averageQueryTime).toBe(0)
      expect(metrics.errorRate).toBe(0)
    })

    it('should reset all metrics', () => {
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
      expect(operation).toHaveBeenCalledTimes(1)
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(1)
      expect(metrics.errorCount).toBe(0)
      expect(metrics.averageQueryTime).toBeGreaterThanOrEqual(0)
      expect(metrics.errorRate).toBe(0)
    })

    it('should track failed operations', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'))
      
      await expect(withMetrics(operation)).rejects.toThrow('Operation failed')
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.queryCount).toBe(1)
      expect(metrics.errorCount).toBe(1)
      expect(metrics.averageQueryTime).toBeGreaterThan(0)
      expect(metrics.errorRate).toBe(1)
    })

    it('should measure operation time accurately', async () => {
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'success'
      })
      
      await withMetrics(operation)
      
      const metrics = DatabaseMetrics.getMetrics()
      expect(metrics.averageQueryTime).toBeGreaterThanOrEqual(40) // Allow some variance
    })
  })
})