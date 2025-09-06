import { describe, it, expect, beforeEach } from 'vitest'
import { PhoneService, NotFoundError, ConflictError } from '../services/index.js'
import { testDb, createTestBrand, createTestPhone, createTestPhoneSpecification } from './setup.js'

describe('PhoneService', () => {
  let phoneService: PhoneService
  let testBrandId: string

  beforeEach(async () => {
    phoneService = new PhoneService()
    
    // Create a test brand for phone tests
    const brand = await testDb.brand.create({ data: createTestBrand() })
    testBrandId = brand.id
  })

  describe('createPhone', () => {
    it('should create a new phone successfully', async () => {
      const phoneData = createTestPhone(testBrandId)
      const phone = await phoneService.createPhone(phoneData)

      expect(phone).toMatchObject({
        brandId: phoneData.brandId,
        model: phoneData.model,
        variant: phoneData.variant,
        slug: phoneData.slug,
        availability: phoneData.availability,
        mrp: phoneData.mrp,
        currentPrice: phoneData.currentPrice,
        currency: phoneData.currency,
        isActive: phoneData.isActive,
      })
      expect(phone.id).toBeDefined()
      expect(phone.brand).toBeDefined()
      expect(phone.createdAt).toBeDefined()
    })

    it('should throw ConflictError for duplicate slug', async () => {
      const phoneData = createTestPhone(testBrandId)
      await phoneService.createPhone(phoneData)

      await expect(phoneService.createPhone(phoneData)).rejects.toThrow(ConflictError)
    })

    it('should throw NotFoundError for non-existent brand', async () => {
      const phoneData = createTestPhone('non-existent-brand-id')
      await expect(phoneService.createPhone(phoneData)).rejects.toThrow(NotFoundError)
    })
  })

  describe('getAllPhones', () => {
    beforeEach(async () => {
      const phone1 = await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'Phone 1', slug: 'test-phone-1' }) 
      })
      const phone2 = await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'Phone 2', slug: 'test-phone-2' }) 
      })
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'Inactive Phone', slug: 'inactive-phone', isActive: false }) 
      })

      // Add specifications
      await testDb.phoneSpecification.create({ data: createTestPhoneSpecification(phone1.id) })
      await testDb.phoneSpecification.create({ data: createTestPhoneSpecification(phone2.id) })
    })

    it('should return all active phones with brand and specifications', async () => {
      const phones = await phoneService.getAllPhones()

      expect(phones).toHaveLength(2)
      expect(phones[0].brand).toBeDefined()
      expect(phones[0].specifications).toBeDefined()
      expect(phones.every(p => p.isActive)).toBe(true)
    })

    it('should filter by brand', async () => {
      const anotherBrand = await testDb.brand.create({ 
        data: createTestBrand({ name: 'Another Brand', slug: 'another-brand' }) 
      })
      await testDb.phone.create({ 
        data: createTestPhone(anotherBrand.id, { model: 'Another Phone', slug: 'another-phone' }) 
      })

      const phones = await phoneService.getAllPhones({ brandId: testBrandId })

      expect(phones).toHaveLength(2)
      expect(phones.every(p => p.brandId === testBrandId)).toBe(true)
    })

    it('should filter by price range', async () => {
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { 
          model: 'Expensive Phone', 
          slug: 'expensive-phone', 
          currentPrice: 100000 
        }) 
      })

      const phones = await phoneService.getAllPhones({ priceMin: 40000, priceMax: 50000 })

      expect(phones.every(p => p.currentPrice! >= 40000 && p.currentPrice! <= 50000)).toBe(true)
    })
  })

  describe('getPhoneById', () => {
    it('should return phone by ID with brand and specifications', async () => {
      const created = await testDb.phone.create({ data: createTestPhone(testBrandId) })
      await testDb.phoneSpecification.create({ data: createTestPhoneSpecification(created.id) })

      const phone = await phoneService.getPhoneById(created.id)

      expect(phone.id).toBe(created.id)
      expect(phone.brand).toBeDefined()
      expect(phone.specifications).toBeDefined()
    })

    it('should throw NotFoundError for non-existent ID', async () => {
      await expect(phoneService.getPhoneById('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getPhoneBySlug', () => {
    it('should return phone by slug', async () => {
      const created = await testDb.phone.create({ data: createTestPhone(testBrandId) })
      const phone = await phoneService.getPhoneBySlug(created.slug)

      expect(phone.slug).toBe(created.slug)
      expect(phone.brand).toBeDefined()
    })

    it('should throw NotFoundError for non-existent slug', async () => {
      await expect(phoneService.getPhoneBySlug('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('searchPhones', () => {
    beforeEach(async () => {
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'iPhone 15', slug: 'iphone-15' }) 
      })
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'Galaxy S24', slug: 'galaxy-s24' }) 
      })
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'OnePlus 12', slug: 'oneplus-12' }) 
      })
    })

    it('should search phones by model name (case insensitive)', async () => {
      const phones = await phoneService.searchPhones('iphone')
      expect(phones).toHaveLength(1)
      expect(phones[0].model).toBe('iPhone 15')
    })

    it('should search phones by variant', async () => {
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { 
          model: 'Test Phone', 
          variant: 'Pro Max', 
          slug: 'test-phone-pro-max' 
        }) 
      })

      const phones = await phoneService.searchPhones('pro max')
      expect(phones).toHaveLength(1)
      expect(phones[0].variant).toBe('Pro Max')
    })

    it('should limit search results', async () => {
      // Create many phones
      for (let i = 0; i < 25; i++) {
        await testDb.phone.create({ 
          data: createTestPhone(testBrandId, { 
            model: `Test Phone ${i}`, 
            slug: `test-phone-${i}` 
          }) 
        })
      }

      const phones = await phoneService.searchPhones('test')
      expect(phones.length).toBeLessThanOrEqual(20)
    })
  })

  describe('getPhoneByBrandAndModel', () => {
    beforeEach(async () => {
      const brand = await testDb.brand.findFirst({ where: { id: testBrandId } })
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { model: 'Test Model', variant: 'Pro' }) 
      })
    })

    it('should return phone by brand slug and model', async () => {
      const brand = await testDb.brand.findFirst({ where: { id: testBrandId } })
      const phone = await phoneService.getPhoneByBrandAndModel(brand!.slug, 'Test Model')

      expect(phone.model).toBe('Test Model')
      expect(phone.brand.slug).toBe(brand!.slug)
    })

    it('should return phone by brand slug, model, and variant', async () => {
      const brand = await testDb.brand.findFirst({ where: { id: testBrandId } })
      const phone = await phoneService.getPhoneByBrandAndModel(brand!.slug, 'Test Model', 'Pro')

      expect(phone.model).toBe('Test Model')
      expect(phone.variant).toBe('Pro')
    })

    it('should throw NotFoundError for non-existent combination', async () => {
      const brand = await testDb.brand.findFirst({ where: { id: testBrandId } })
      await expect(
        phoneService.getPhoneByBrandAndModel(brand!.slug, 'Non-existent Model')
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('updatePhone', () => {
    it('should update phone successfully', async () => {
      const created = await testDb.phone.create({ data: createTestPhone(testBrandId) })
      const updateData = { model: 'Updated Phone', currentPrice: 40000 }
      
      const updated = await phoneService.updatePhone(created.id, updateData)

      expect(updated.model).toBe(updateData.model)
      expect(updated.currentPrice).toBe(updateData.currentPrice)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())
    })

    it('should throw NotFoundError for non-existent ID', async () => {
      await expect(phoneService.updatePhone('non-existent', { model: 'Test' })).rejects.toThrow(NotFoundError)
    })
  })

  describe('deletePhone', () => {
    it('should soft delete phone (set isActive to false)', async () => {
      const created = await testDb.phone.create({ data: createTestPhone(testBrandId) })
      
      const deleted = await phoneService.deletePhone(created.id)

      expect(deleted.isActive).toBe(false)
      
      // Verify it's not returned in getAllPhones
      const phones = await phoneService.getAllPhones()
      expect(phones.find(p => p.id === created.id)).toBeUndefined()
    })

    it('should throw NotFoundError for non-existent ID', async () => {
      await expect(phoneService.deletePhone('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getPhonesByPriceRange', () => {
    beforeEach(async () => {
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { 
          model: 'Budget Phone', 
          slug: 'budget-phone', 
          currentPrice: 15000 
        }) 
      })
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { 
          model: 'Mid Range Phone', 
          slug: 'mid-range-phone', 
          currentPrice: 30000 
        }) 
      })
      await testDb.phone.create({ 
        data: createTestPhone(testBrandId, { 
          model: 'Premium Phone', 
          slug: 'premium-phone', 
          currentPrice: 80000 
        }) 
      })
    })

    it('should return phones within price range', async () => {
      const phones = await phoneService.getPhonesByPriceRange(20000, 50000)

      expect(phones).toHaveLength(1)
      expect(phones[0].model).toBe('Mid Range Phone')
    })

    it('should return phones sorted by price', async () => {
      const phones = await phoneService.getPhonesByPriceRange(10000, 100000)

      expect(phones).toHaveLength(3)
      expect(phones[0].currentPrice).toBeLessThanOrEqual(phones[1].currentPrice!)
      expect(phones[1].currentPrice).toBeLessThanOrEqual(phones[2].currentPrice!)
    })
  })
})