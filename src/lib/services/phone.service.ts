import { BaseService, NotFoundError, ConflictError } from './base.service.js'
import type { Phone, PhoneSpecification, Brand, Prisma, PhoneAvailability } from '../database.js'

export interface CreatePhoneData {
  brandId: string
  model: string
  variant?: string
  slug: string
  launchDate?: Date
  availability?: PhoneAvailability
  mrp?: number
  currentPrice?: number
  currency?: string
  images?: string[]
  isActive?: boolean
}

export interface UpdatePhoneData {
  model?: string
  variant?: string
  slug?: string
  launchDate?: Date
  availability?: PhoneAvailability
  mrp?: number
  currentPrice?: number
  currency?: string
  images?: string[]
  isActive?: boolean
}

export interface PhoneWithDetails extends Phone {
  brand: Brand
  specifications: PhoneSpecification | null
}

export interface PhoneSearchFilters {
  brandId?: string
  availability?: PhoneAvailability
  priceMin?: number
  priceMax?: number
  isActive?: boolean
}

/**
 * Service class for phone-related database operations
 */
export class PhoneService extends BaseService {
  /**
   * Get all phones with optional filters
   */
  async getAllPhones(filters?: PhoneSearchFilters): Promise<PhoneWithDetails[]> {
    return this.execute(async () => {
      const where: Prisma.PhoneWhereInput = {
        isActive: filters?.isActive ?? true,
      }

      if (filters?.brandId) {
        where.brandId = filters.brandId
      }

      if (filters?.availability) {
        where.availability = filters.availability
      }

      if (filters?.priceMin || filters?.priceMax) {
        where.currentPrice = {}
        if (filters.priceMin) {
          where.currentPrice.gte = filters.priceMin
        }
        if (filters.priceMax) {
          where.currentPrice.lte = filters.priceMax
        }
      }

      return this.db.phone.findMany({
        where,
        include: {
          brand: true,
          specifications: true,
        },
        orderBy: [
          { brand: { name: 'asc' } },
          { model: 'asc' },
          { variant: 'asc' },
        ],
      })
    })
  }

  /**
   * Get phone by ID with full details
   */
  async getPhoneById(id: string): Promise<PhoneWithDetails> {
    return this.execute(async () => {
      const phone = await this.db.phone.findUnique({
        where: { id },
        include: {
          brand: true,
          specifications: true,
        },
      })

      if (!phone) {
        throw new NotFoundError('Phone', id)
      }

      return phone
    })
  }

  /**
   * Get phone by slug
   */
  async getPhoneBySlug(slug: string): Promise<PhoneWithDetails> {
    return this.execute(async () => {
      const phone = await this.db.phone.findUnique({
        where: { slug },
        include: {
          brand: true,
          specifications: true,
        },
      })

      if (!phone) {
        throw new NotFoundError('Phone', slug)
      }

      return phone
    })
  }

  /**
   * Search phones by model name
   */
  async searchPhones(query: string, brandId?: string): Promise<PhoneWithDetails[]> {
    return this.execute(async () => {
      const where: Prisma.PhoneWhereInput = {
        isActive: true,
        OR: [
          { model: { contains: query, mode: 'insensitive' } },
          { variant: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      }

      if (brandId) {
        where.brandId = brandId
      }

      return this.db.phone.findMany({
        where,
        include: {
          brand: true,
          specifications: true,
        },
        orderBy: [
          { brand: { name: 'asc' } },
          { model: 'asc' },
          { variant: 'asc' },
        ],
        take: 20, // Limit search results
      })
    })
  }

  /**
   * Get phones by brand
   */
  async getPhonesByBrand(brandId: string): Promise<PhoneWithDetails[]> {
    return this.execute(async () => {
      return this.db.phone.findMany({
        where: {
          brandId,
          isActive: true,
        },
        include: {
          brand: true,
          specifications: true,
        },
        orderBy: [
          { model: 'asc' },
          { variant: 'asc' },
        ],
      })
    })
  }

  /**
   * Get phone by brand and model
   */
  async getPhoneByBrandAndModel(
    brandSlug: string,
    model: string,
    variant?: string
  ): Promise<PhoneWithDetails> {
    return this.execute(async () => {
      const where: Prisma.PhoneWhereInput = {
        brand: { slug: brandSlug },
        model: { equals: model, mode: 'insensitive' },
        isActive: true,
      }

      if (variant) {
        where.variant = { equals: variant, mode: 'insensitive' }
      }

      const phone = await this.db.phone.findFirst({
        where,
        include: {
          brand: true,
          specifications: true,
        },
      })

      if (!phone) {
        const identifier = variant ? `${brandSlug}/${model}/${variant}` : `${brandSlug}/${model}`
        throw new NotFoundError('Phone', identifier)
      }

      return phone
    })
  }

  /**
   * Create a new phone
   */
  async createPhone(data: CreatePhoneData): Promise<PhoneWithDetails> {
    return this.execute(async () => {
      try {
        const phone = await this.db.phone.create({
          data: {
            brandId: data.brandId,
            model: data.model,
            variant: data.variant,
            slug: data.slug,
            launchDate: data.launchDate,
            availability: data.availability ?? 'AVAILABLE',
            mrp: data.mrp,
            currentPrice: data.currentPrice,
            currency: data.currency ?? 'INR',
            images: data.images ?? [],
            isActive: data.isActive ?? true,
          },
          include: {
            brand: true,
            specifications: true,
          },
        })

        return phone
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictError(`Phone with slug '${data.slug}' already exists`)
          }
          if (error.code === 'P2003') {
            throw new NotFoundError('Brand', data.brandId)
          }
        }
        throw error
      }
    })
  }

  /**
   * Update a phone
   */
  async updatePhone(id: string, data: UpdatePhoneData): Promise<PhoneWithDetails> {
    return this.execute(async () => {
      try {
        const phone = await this.db.phone.update({
          where: { id },
          data,
          include: {
            brand: true,
            specifications: true,
          },
        })

        return phone
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('Phone', id)
          }
          if (error.code === 'P2002') {
            throw new ConflictError(`Phone with slug '${data.slug}' already exists`)
          }
        }
        throw error
      }
    })
  }

  /**
   * Delete a phone (soft delete)
   */
  async deletePhone(id: string): Promise<PhoneWithDetails> {
    return this.execute(async () => {
      try {
        const phone = await this.db.phone.update({
          where: { id },
          data: { isActive: false },
          include: {
            brand: true,
            specifications: true,
          },
        })

        return phone
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('Phone', id)
          }
        }
        throw error
      }
    })
  }

  /**
   * Get popular phones (by comparison count or other metrics)
   */
  async getPopularPhones(limit: number = 10): Promise<PhoneWithDetails[]> {
    return this.execute(async () => {
      return this.db.phone.findMany({
        where: {
          isActive: true,
          availability: 'AVAILABLE',
        },
        include: {
          brand: true,
          specifications: true,
          _count: {
            select: {
              comparisons1: true,
              comparisons2: true,
            },
          },
        },
        orderBy: [
          { launchDate: 'desc' },
          { currentPrice: 'desc' },
        ],
        take: limit,
      })
    })
  }

  /**
   * Get phones in price range
   */
  async getPhonesByPriceRange(
    minPrice: number,
    maxPrice: number,
    brandId?: string
  ): Promise<PhoneWithDetails[]> {
    return this.execute(async () => {
      const where: Prisma.PhoneWhereInput = {
        isActive: true,
        availability: 'AVAILABLE',
        currentPrice: {
          gte: minPrice,
          lte: maxPrice,
        },
      }

      if (brandId) {
        where.brandId = brandId
      }

      return this.db.phone.findMany({
        where,
        include: {
          brand: true,
          specifications: true,
        },
        orderBy: { currentPrice: 'asc' },
      })
    })
  }
}