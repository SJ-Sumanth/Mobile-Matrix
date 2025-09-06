import { describe, it, expect, vi } from 'vitest'
import { BrandService, PhoneService, ChatService, ComparisonService } from '../services/index.js'

describe('Database Services Integration', () => {
  describe('Service Instantiation', () => {
    it('should create all service instances successfully', () => {
      const brandService = new BrandService()
      const phoneService = new PhoneService()
      const chatService = new ChatService()
      const comparisonService = new ComparisonService()

      expect(brandService).toBeInstanceOf(BrandService)
      expect(phoneService).toBeInstanceOf(PhoneService)
      expect(chatService).toBeInstanceOf(ChatService)
      expect(comparisonService).toBeInstanceOf(ComparisonService)
    })

    it('should have access to database metrics', () => {
      const brandService = new BrandService()
      
      const metrics = brandService.getMetrics()
      
      expect(metrics).toHaveProperty('queryCount')
      expect(metrics).toHaveProperty('errorCount')
      expect(metrics).toHaveProperty('averageQueryTime')
      expect(metrics).toHaveProperty('errorRate')
    })

    it('should be able to reset metrics', () => {
      const brandService = new BrandService()
      
      // This should not throw
      expect(() => brandService.resetMetrics()).not.toThrow()
    })
  })

  describe('Service Method Signatures', () => {
    it('should have correct BrandService methods', () => {
      const brandService = new BrandService()

      expect(typeof brandService.getAllBrands).toBe('function')
      expect(typeof brandService.getBrandById).toBe('function')
      expect(typeof brandService.getBrandBySlug).toBe('function')
      expect(typeof brandService.searchBrands).toBe('function')
      expect(typeof brandService.createBrand).toBe('function')
      expect(typeof brandService.updateBrand).toBe('function')
      expect(typeof brandService.deleteBrand).toBe('function')
      expect(typeof brandService.getBrandWithPhoneCount).toBe('function')
    })

    it('should have correct PhoneService methods', () => {
      const phoneService = new PhoneService()

      expect(typeof phoneService.getAllPhones).toBe('function')
      expect(typeof phoneService.getPhoneById).toBe('function')
      expect(typeof phoneService.getPhoneBySlug).toBe('function')
      expect(typeof phoneService.searchPhones).toBe('function')
      expect(typeof phoneService.getPhonesByBrand).toBe('function')
      expect(typeof phoneService.getPhoneByBrandAndModel).toBe('function')
      expect(typeof phoneService.createPhone).toBe('function')
      expect(typeof phoneService.updatePhone).toBe('function')
      expect(typeof phoneService.deletePhone).toBe('function')
      expect(typeof phoneService.getPopularPhones).toBe('function')
      expect(typeof phoneService.getPhonesByPriceRange).toBe('function')
    })

    it('should have correct ChatService methods', () => {
      const chatService = new ChatService()

      expect(typeof chatService.createChatSession).toBe('function')
      expect(typeof chatService.getChatSession).toBe('function')
      expect(typeof chatService.getChatSessionWithMessages).toBe('function')
      expect(typeof chatService.updateChatSession).toBe('function')
      expect(typeof chatService.addMessage).toBe('function')
      expect(typeof chatService.getMessages).toBe('function')
      expect(typeof chatService.getRecentMessages).toBe('function')
      expect(typeof chatService.deleteChatSession).toBe('function')
      expect(typeof chatService.getUserActiveSessions).toBe('function')
      expect(typeof chatService.deactivateOldSessions).toBe('function')
      expect(typeof chatService.getChatSessionStats).toBe('function')
    })

    it('should have correct ComparisonService methods', () => {
      const comparisonService = new ComparisonService()

      expect(typeof comparisonService.createComparison).toBe('function')
      expect(typeof comparisonService.getComparisonById).toBe('function')
      expect(typeof comparisonService.getComparisonByShareToken).toBe('function')
      expect(typeof comparisonService.getComparisonByPhones).toBe('function')
      expect(typeof comparisonService.updateComparison).toBe('function')
      expect(typeof comparisonService.deleteComparison).toBe('function')
      expect(typeof comparisonService.getComparisonsByChatSession).toBe('function')
      expect(typeof comparisonService.getPopularComparisons).toBe('function')
      expect(typeof comparisonService.getComparisonsForPhone).toBe('function')
      expect(typeof comparisonService.generateShareToken).toBe('function')
      expect(typeof comparisonService.getComparisonStats).toBe('function')
    })
  })

  describe('Service Error Types', () => {
    it('should export correct error types', async () => {
      const { 
        DatabaseError, 
        NotFoundError, 
        ValidationError, 
        ConflictError 
      } = await import('../services/index.js')

      expect(DatabaseError).toBeDefined()
      expect(NotFoundError).toBeDefined()
      expect(ValidationError).toBeDefined()
      expect(ConflictError).toBeDefined()

      // Test error instantiation
      const dbError = new DatabaseError('Test error')
      const notFoundError = new NotFoundError('User', '123')
      const validationError = new ValidationError('Invalid data', 'email')
      const conflictError = new ConflictError('Duplicate entry')

      expect(dbError.message).toBe('Test error')
      expect(notFoundError.message).toBe("User with identifier '123' not found")
      expect(validationError.message).toBe('Invalid data')
      expect(validationError.field).toBe('email')
      expect(conflictError.message).toBe('Duplicate entry')
    })
  })

  describe('Utility Functions', () => {
    it('should have share token generation', () => {
      const comparisonService = new ComparisonService()
      
      const token1 = comparisonService.generateShareToken()
      const token2 = comparisonService.generateShareToken()
      
      expect(typeof token1).toBe('string')
      expect(typeof token2).toBe('string')
      expect(token1).not.toBe(token2) // Should generate unique tokens
      expect(token1.length).toBeGreaterThan(10) // Should be reasonably long
    })
  })
})