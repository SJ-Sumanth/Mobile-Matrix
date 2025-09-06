import { BaseService, NotFoundError, ConflictError } from './base.service.js'
import type { PhoneComparison, Phone, Brand, PhoneSpecification, Prisma } from '../database.js'

export interface CreateComparisonData {
  chatSessionId?: string
  phone1Id: string
  phone2Id: string
  result?: Record<string, any>
  insights?: string[]
  overallWinner?: string
  shareToken?: string
}

export interface UpdateComparisonData {
  result?: Record<string, any>
  insights?: string[]
  overallWinner?: string
  shareToken?: string
}

export interface ComparisonWithPhones extends PhoneComparison {
  phone1: Phone & { brand: Brand; specifications: PhoneSpecification | null }
  phone2: Phone & { brand: Brand; specifications: PhoneSpecification | null }
}

/**
 * Service class for phone comparison operations
 */
export class ComparisonService extends BaseService {
  /**
   * Create a new phone comparison
   */
  async createComparison(data: CreateComparisonData): Promise<ComparisonWithPhones> {
    return this.execute(async () => {
      try {
        const comparison = await this.db.phoneComparison.create({
          data: {
            chatSessionId: data.chatSessionId,
            phone1Id: data.phone1Id,
            phone2Id: data.phone2Id,
            result: data.result,
            insights: data.insights ?? [],
            overallWinner: data.overallWinner,
            shareToken: data.shareToken,
          },
          include: {
            phone1: {
              include: {
                brand: true,
                specifications: true,
              },
            },
            phone2: {
              include: {
                brand: true,
                specifications: true,
              },
            },
          },
        })

        return comparison
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictError('Comparison between these phones already exists')
          }
          if (error.code === 'P2003') {
            throw new NotFoundError('Phone or ChatSession', 'referenced entity')
          }
        }
        throw error
      }
    })
  }

  /**
   * Get comparison by ID
   */
  async getComparisonById(id: string): Promise<ComparisonWithPhones> {
    return this.execute(async () => {
      const comparison = await this.db.phoneComparison.findUnique({
        where: { id },
        include: {
          phone1: {
            include: {
              brand: true,
              specifications: true,
            },
          },
          phone2: {
            include: {
              brand: true,
              specifications: true,
            },
          },
        },
      })

      if (!comparison) {
        throw new NotFoundError('PhoneComparison', id)
      }

      return comparison
    })
  }

  /**
   * Get comparison by share token
   */
  async getComparisonByShareToken(shareToken: string): Promise<ComparisonWithPhones> {
    return this.execute(async () => {
      const comparison = await this.db.phoneComparison.findUnique({
        where: { shareToken },
        include: {
          phone1: {
            include: {
              brand: true,
              specifications: true,
            },
          },
          phone2: {
            include: {
              brand: true,
              specifications: true,
            },
          },
        },
      })

      if (!comparison) {
        throw new NotFoundError('PhoneComparison', shareToken)
      }

      return comparison
    })
  }

  /**
   * Get comparison between two specific phones
   */
  async getComparisonByPhones(phone1Id: string, phone2Id: string): Promise<ComparisonWithPhones | null> {
    return this.execute(async () => {
      // Try both combinations since the order might be different
      const comparison = await this.db.phoneComparison.findFirst({
        where: {
          OR: [
            { phone1Id, phone2Id },
            { phone1Id: phone2Id, phone2Id: phone1Id },
          ],
        },
        include: {
          phone1: {
            include: {
              brand: true,
              specifications: true,
            },
          },
          phone2: {
            include: {
              brand: true,
              specifications: true,
            },
          },
        },
      })

      return comparison
    })
  }

  /**
   * Update comparison
   */
  async updateComparison(id: string, data: UpdateComparisonData): Promise<ComparisonWithPhones> {
    return this.execute(async () => {
      try {
        const comparison = await this.db.phoneComparison.update({
          where: { id },
          data: {
            result: data.result,
            insights: data.insights,
            overallWinner: data.overallWinner,
            shareToken: data.shareToken,
          },
          include: {
            phone1: {
              include: {
                brand: true,
                specifications: true,
              },
            },
            phone2: {
              include: {
                brand: true,
                specifications: true,
              },
            },
          },
        })

        return comparison
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('PhoneComparison', id)
          }
        }
        throw error
      }
    })
  }

  /**
   * Delete comparison
   */
  async deleteComparison(id: string): Promise<void> {
    return this.execute(async () => {
      try {
        await this.db.phoneComparison.delete({
          where: { id },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('PhoneComparison', id)
          }
        }
        throw error
      }
    })
  }

  /**
   * Get comparisons for a chat session
   */
  async getComparisonsByChatSession(chatSessionId: string): Promise<ComparisonWithPhones[]> {
    return this.execute(async () => {
      return this.db.phoneComparison.findMany({
        where: { chatSessionId },
        include: {
          phone1: {
            include: {
              brand: true,
              specifications: true,
            },
          },
          phone2: {
            include: {
              brand: true,
              specifications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  }

  /**
   * Get popular comparisons (most frequently compared phones)
   */
  async getPopularComparisons(limit: number = 10): Promise<{
    phone1: Phone & { brand: Brand }
    phone2: Phone & { brand: Brand }
    comparisonCount: number
  }[]> {
    return this.execute(async () => {
      const comparisons = await this.db.phoneComparison.groupBy({
        by: ['phone1Id', 'phone2Id'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      })

      // Fetch phone details for each comparison
      const results = await Promise.all(
        comparisons.map(async (comp) => {
          const [phone1, phone2] = await Promise.all([
            this.db.phone.findUnique({
              where: { id: comp.phone1Id },
              include: { brand: true },
            }),
            this.db.phone.findUnique({
              where: { id: comp.phone2Id },
              include: { brand: true },
            }),
          ])

          return {
            phone1: phone1!,
            phone2: phone2!,
            comparisonCount: comp._count.id,
          }
        })
      )

      return results.filter(result => result.phone1 && result.phone2)
    })
  }

  /**
   * Get comparisons involving a specific phone
   */
  async getComparisonsForPhone(phoneId: string): Promise<ComparisonWithPhones[]> {
    return this.execute(async () => {
      return this.db.phoneComparison.findMany({
        where: {
          OR: [
            { phone1Id: phoneId },
            { phone2Id: phoneId },
          ],
        },
        include: {
          phone1: {
            include: {
              brand: true,
              specifications: true,
            },
          },
          phone2: {
            include: {
              brand: true,
              specifications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  }

  /**
   * Generate a unique share token for a comparison
   */
  generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Get comparison statistics
   */
  async getComparisonStats(): Promise<{
    totalComparisons: number
    uniquePhoneComparisons: number
    averageComparisonsPerPhone: number
    mostComparedPhone: { phone: Phone & { brand: Brand }; count: number } | null
  }> {
    return this.execute(async () => {
      const [totalComparisons, uniqueComparisons, phoneComparisonCounts] = await Promise.all([
        this.db.phoneComparison.count(),
        this.db.phoneComparison.groupBy({
          by: ['phone1Id', 'phone2Id'],
          _count: { id: true },
        }),
        this.db.phoneComparison.groupBy({
          by: ['phone1Id'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 1,
        }),
      ])

      const uniquePhoneComparisons = uniqueComparisons.length
      const totalPhones = await this.db.phone.count({ where: { isActive: true } })
      const averageComparisonsPerPhone = totalPhones > 0 ? totalComparisons / totalPhones : 0

      let mostComparedPhone = null
      if (phoneComparisonCounts.length > 0) {
        const topPhone = await this.db.phone.findUnique({
          where: { id: phoneComparisonCounts[0].phone1Id },
          include: { brand: true },
        })

        if (topPhone) {
          mostComparedPhone = {
            phone: topPhone,
            count: phoneComparisonCounts[0]._count.id,
          }
        }
      }

      return {
        totalComparisons,
        uniquePhoneComparisons,
        averageComparisonsPerPhone,
        mostComparedPhone,
      }
    })
  }
}