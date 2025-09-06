import { BaseService, NotFoundError, ConflictError } from './base.service.js'
import type { Brand, Prisma } from '../database.js'

export interface CreateBrandData {
  name: string
  slug: string
  logoUrl?: string
  description?: string
  isActive?: boolean
}

export interface UpdateBrandData {
  name?: string
  slug?: string
  logoUrl?: string
  description?: string
  isActive?: boolean
}

/**
 * Service class for brand-related database operations
 */
export class BrandService extends BaseService {
  /**
   * Get all active brands
   */
  async getAllBrands(): Promise<Brand[]> {
    return this.execute(async () => {
      return this.db.brand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    })
  }

  /**
   * Get brand by ID
   */
  async getBrandById(id: string): Promise<Brand> {
    return this.execute(async () => {
      const brand = await this.db.brand.findUnique({
        where: { id },
      })

      if (!brand) {
        throw new NotFoundError('Brand', id)
      }

      return brand
    })
  }

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string): Promise<Brand> {
    return this.execute(async () => {
      const brand = await this.db.brand.findUnique({
        where: { slug },
      })

      if (!brand) {
        throw new NotFoundError('Brand', slug)
      }

      return brand
    })
  }

  /**
   * Search brands by name
   */
  async searchBrands(query: string): Promise<Brand[]> {
    return this.execute(async () => {
      return this.db.brand.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { name: 'asc' },
      })
    })
  }

  /**
   * Create a new brand
   */
  async createBrand(data: CreateBrandData): Promise<Brand> {
    return this.execute(async () => {
      try {
        return await this.db.brand.create({
          data: {
            name: data.name,
            slug: data.slug,
            logoUrl: data.logoUrl,
            description: data.description,
            isActive: data.isActive ?? true,
          },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictError(`Brand with slug '${data.slug}' already exists`)
          }
        }
        throw error
      }
    })
  }

  /**
   * Update a brand
   */
  async updateBrand(id: string, data: UpdateBrandData): Promise<Brand> {
    return this.execute(async () => {
      try {
        return await this.db.brand.update({
          where: { id },
          data,
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('Brand', id)
          }
          if (error.code === 'P2002') {
            throw new ConflictError(`Brand with slug '${data.slug}' already exists`)
          }
        }
        throw error
      }
    })
  }

  /**
   * Delete a brand (soft delete by setting isActive to false)
   */
  async deleteBrand(id: string): Promise<Brand> {
    return this.execute(async () => {
      try {
        return await this.db.brand.update({
          where: { id },
          data: { isActive: false },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('Brand', id)
          }
        }
        throw error
      }
    })
  }

  /**
   * Get brand with phone count
   */
  async getBrandWithPhoneCount(id: string): Promise<Brand & { phoneCount: number }> {
    return this.execute(async () => {
      const brand = await this.db.brand.findUnique({
        where: { id },
        include: {
          _count: {
            select: { phones: true },
          },
        },
      })

      if (!brand) {
        throw new NotFoundError('Brand', id)
      }

      return {
        ...brand,
        phoneCount: brand._count.phones,
      }
    })
  }
}