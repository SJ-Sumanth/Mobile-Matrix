import { describe, it, expect, beforeEach } from 'vitest'
import { BrandService, NotFoundError, ConflictError } from '../services/index.js'
import { testDb, createTestBrand } from './setup.js'

describe('BrandService', () => {
  let brandService: BrandService

  beforeEach(() => {
    brandService = new BrandService()
  })

  describe('createBrand', () => {
    it('should create a new brand successfully', async () => {
      const brandData = createTestBrand()
      const brand = await brandService.createBrand(brandData)

      expect(brand).toMatchObject({
        name: brandData.name,
        slug: brandData.slug,
        logoUrl: brandData.logoUrl,
        description: brandData.description,
        isActive: brandData.isActive,
      })
      expect(brand.id).toBeDefined()
      expect(brand.createdAt).toBeDefined()
      expect(brand.updatedAt).toBeDefined()
    })

    it('should throw ConflictError for duplicate slug', async () => {
      const brandData = createTestBrand()
      await brandService.createBrand(brandData)

      await expect(brandService.createBrand(brandData)).rejects.toThrow(ConflictError)
    })
  })

  describe('getAllBrands', () => {
    it('should return all active brands', async () => {
      const brand1 = await testDb.brand.create({ data: createTestBrand({ name: 'Brand 1', slug: 'brand-1' }) })
      const brand2 = await testDb.brand.create({ data: createTestBrand({ name: 'Brand 2', slug: 'brand-2' }) })
      await testDb.brand.create({ data: createTestBrand({ name: 'Inactive Brand', slug: 'inactive', isActive: false }) })

      const brands = await brandService.getAllBrands()

      expect(brands).toHaveLength(2)
      expect(brands.map(b => b.name)).toEqual(['Brand 1', 'Brand 2'])
    })

    it('should return brands sorted by name', async () => {
      await testDb.brand.create({ data: createTestBrand({ name: 'Zebra', slug: 'zebra' }) })
      await testDb.brand.create({ data: createTestBrand({ name: 'Apple', slug: 'apple' }) })

      const brands = await brandService.getAllBrands()

      expect(brands[0].name).toBe('Apple')
      expect(brands[1].name).toBe('Zebra')
    })
  })

  describe('getBrandById', () => {
    it('should return brand by ID', async () => {
      const created = await testDb.brand.create({ data: createTestBrand() })
      const brand = await brandService.getBrandById(created.id)

      expect(brand).toMatchObject(created)
    })

    it('should throw NotFoundError for non-existent ID', async () => {
      await expect(brandService.getBrandById('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getBrandBySlug', () => {
    it('should return brand by slug', async () => {
      const created = await testDb.brand.create({ data: createTestBrand() })
      const brand = await brandService.getBrandBySlug(created.slug)

      expect(brand).toMatchObject(created)
    })

    it('should throw NotFoundError for non-existent slug', async () => {
      await expect(brandService.getBrandBySlug('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('searchBrands', () => {
    beforeEach(async () => {
      await testDb.brand.create({ data: createTestBrand({ name: 'Apple', slug: 'apple' }) })
      await testDb.brand.create({ data: createTestBrand({ name: 'Samsung', slug: 'samsung' }) })
      await testDb.brand.create({ data: createTestBrand({ name: 'OnePlus', slug: 'oneplus' }) })
    })

    it('should search brands by name (case insensitive)', async () => {
      const brands = await brandService.searchBrands('apple')
      expect(brands).toHaveLength(1)
      expect(brands[0].name).toBe('Apple')
    })

    it('should search brands by slug', async () => {
      const brands = await brandService.searchBrands('samsung')
      expect(brands).toHaveLength(1)
      expect(brands[0].name).toBe('Samsung')
    })

    it('should return partial matches', async () => {
      const brands = await brandService.searchBrands('plus')
      expect(brands).toHaveLength(1)
      expect(brands[0].name).toBe('OnePlus')
    })

    it('should return empty array for no matches', async () => {
      const brands = await brandService.searchBrands('nonexistent')
      expect(brands).toHaveLength(0)
    })
  })

  describe('updateBrand', () => {
    it('should update brand successfully', async () => {
      const created = await testDb.brand.create({ data: createTestBrand() })
      const updateData = { name: 'Updated Brand', description: 'Updated description' }
      
      const updated = await brandService.updateBrand(created.id, updateData)

      expect(updated.name).toBe(updateData.name)
      expect(updated.description).toBe(updateData.description)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())
    })

    it('should throw NotFoundError for non-existent ID', async () => {
      await expect(brandService.updateBrand('non-existent', { name: 'Test' })).rejects.toThrow(NotFoundError)
    })

    it('should throw ConflictError for duplicate slug', async () => {
      const brand1 = await testDb.brand.create({ data: createTestBrand({ slug: 'brand-1' }) })
      const brand2 = await testDb.brand.create({ data: createTestBrand({ slug: 'brand-2' }) })

      await expect(brandService.updateBrand(brand2.id, { slug: 'brand-1' })).rejects.toThrow(ConflictError)
    })
  })

  describe('deleteBrand', () => {
    it('should soft delete brand (set isActive to false)', async () => {
      const created = await testDb.brand.create({ data: createTestBrand() })
      
      const deleted = await brandService.deleteBrand(created.id)

      expect(deleted.isActive).toBe(false)
      
      // Verify it's not returned in getAllBrands
      const brands = await brandService.getAllBrands()
      expect(brands.find(b => b.id === created.id)).toBeUndefined()
    })

    it('should throw NotFoundError for non-existent ID', async () => {
      await expect(brandService.deleteBrand('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getBrandWithPhoneCount', () => {
    it('should return brand with phone count', async () => {
      const brand = await testDb.brand.create({ data: createTestBrand() })
      
      // Create some phones for this brand
      await testDb.phone.create({
        data: {
          brandId: brand.id,
          model: 'Phone 1',
          slug: 'test-phone-1',
        },
      })
      await testDb.phone.create({
        data: {
          brandId: brand.id,
          model: 'Phone 2',
          slug: 'test-phone-2',
        },
      })

      const result = await brandService.getBrandWithPhoneCount(brand.id)

      expect(result.phoneCount).toBe(2)
      expect(result.name).toBe(brand.name)
    })

    it('should return zero phone count for brand with no phones', async () => {
      const brand = await testDb.brand.create({ data: createTestBrand() })
      
      const result = await brandService.getBrandWithPhoneCount(brand.id)

      expect(result.phoneCount).toBe(0)
    })
  })
})