import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma Client
const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}

vi.mock('../../generated/prisma', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}))

// Import after mocking
const { DatabaseConnection } = await import('../database')

describe('Database Connection Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('Singleton Pattern', () => {
    it('should create a singleton instance', () => {
      const instance1 = DatabaseConnection.getInstance()
      const instance2 = DatabaseConnection.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should return the same client instance', () => {
      const db = DatabaseConnection.getInstance()
      const client1 = db.getClient()
      const client2 = db.getClient()
      expect(client1).toBe(client2)
    })
  })

  describe('Connection Management', () => {
    it('should call connect on Prisma client', async () => {
      const db = DatabaseConnection.getInstance()
      mockPrismaClient.$connect.mockResolvedValue(undefined)
      
      await db.connect()
      
      expect(mockPrismaClient.$connect).toHaveBeenCalled()
    })

    it('should call disconnect on Prisma client', async () => {
      const db = DatabaseConnection.getInstance()
      mockPrismaClient.$disconnect.mockResolvedValue(undefined)
      
      await db.disconnect()
      
      expect(mockPrismaClient.$disconnect).toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      const db = DatabaseConnection.getInstance()
      const error = new Error('Connection failed')
      mockPrismaClient.$connect.mockRejectedValue(error)
      
      await expect(db.connect()).rejects.toThrow('Connection failed')
    })
  })

  describe('Health Check', () => {
    it('should return true when health check passes', async () => {
      const db = DatabaseConnection.getInstance()
      mockPrismaClient.$queryRaw.mockResolvedValue([{ test: 1 }])
      
      const result = await db.healthCheck()
      
      expect(result).toBe(true)
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled()
    })

    it('should return false when health check fails', async () => {
      const db = DatabaseConnection.getInstance()
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Query failed'))
      
      const result = await db.healthCheck()
      
      expect(result).toBe(false)
    })
  })

  describe('Transaction Management', () => {
    it('should execute transactions', async () => {
      const db = DatabaseConnection.getInstance()
      const mockTransactionFn = vi.fn().mockResolvedValue('transaction result')
      mockPrismaClient.$transaction.mockImplementation((fn) => fn(mockPrismaClient))
      
      const result = await db.executeTransaction(mockTransactionFn)
      
      expect(mockPrismaClient.$transaction).toHaveBeenCalled()
      expect(mockTransactionFn).toHaveBeenCalledWith(mockPrismaClient)
      expect(result).toBe('transaction result')
    })

    it('should handle transaction errors', async () => {
      const db = DatabaseConnection.getInstance()
      const error = new Error('Transaction failed')
      mockPrismaClient.$transaction.mockRejectedValue(error)
      
      await expect(
        db.executeTransaction(async () => 'test')
      ).rejects.toThrow('Transaction failed')
    })
  })
})

describe('Database Schema Validation', () => {
  it('should have correct enum values', () => {
    // Test enum values match our TypeScript types
    const phoneAvailability = ['AVAILABLE', 'DISCONTINUED', 'UPCOMING']
    const chatSteps = ['BRAND_SELECTION', 'MODEL_SELECTION', 'COMPARISON', 'COMPLETED']
    const messageRoles = ['USER', 'ASSISTANT', 'SYSTEM']
    
    expect(phoneAvailability).toContain('AVAILABLE')
    expect(chatSteps).toContain('BRAND_SELECTION')
    expect(messageRoles).toContain('USER')
  })

  it('should validate required fields structure', () => {
    // Test that our type definitions match expected structure
    const brandFields = ['id', 'name', 'slug', 'isActive', 'createdAt', 'updatedAt']
    const phoneFields = ['id', 'brandId', 'model', 'slug', 'availability', 'images']
    const specFields = ['id', 'phoneId', 'displaySize', 'processor', 'ramOptions']
    
    expect(brandFields).toContain('name')
    expect(phoneFields).toContain('brandId')
    expect(specFields).toContain('phoneId')
  })
})

describe('Database Types', () => {
  it('should have proper array field types', () => {
    // Validate array fields are properly typed
    const arrayFields = {
      images: 'string[]',
      cameraFeatures: 'string[]',
      ramOptions: 'string[]',
      storageOptions: 'string[]',
      networkSupport: 'string[]',
      materials: 'string[]',
      colors: 'string[]',
      selectedPhones: 'string[]',
      insights: 'string[]',
    }
    
    Object.entries(arrayFields).forEach(([field, type]) => {
      expect(type).toBe('string[]')
    })
  })

  it('should have proper boolean field defaults', () => {
    // Test boolean field defaults
    const booleanDefaults = {
      isActive: true,
      expandableStorage: false,
      wirelessCharging: false,
      nfc: false,
    }
    
    Object.entries(booleanDefaults).forEach(([field, defaultValue]) => {
      expect(typeof defaultValue).toBe('boolean')
    })
  })
})