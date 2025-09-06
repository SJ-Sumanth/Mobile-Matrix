import { Prisma } from '../../generated/prisma/index.js';

/**
 * Query optimization utilities for better database performance
 */

/**
 * Optimized query configurations for different use cases
 */
export const QueryOptimizations = {
  // Phone search queries
  phoneSearch: {
    // Include only necessary fields for search results
    select: {
      id: true,
      brandId: true,
      model: true,
      variant: true,
      slug: true,
      currentPrice: true,
      images: true,
      brand: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
    // Limit results for performance
    take: 50,
    // Order by relevance
    orderBy: [
      { brand: { name: 'asc' } },
      { model: 'asc' },
      { currentPrice: 'asc' },
    ] as Prisma.PhoneOrderByWithRelationInput[],
  },

  // Phone details query
  phoneDetails: {
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          description: true,
        },
      },
      specifications: true,
    },
  },

  // Brand listing query
  brandListing: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      _count: {
        select: {
          phones: {
            where: {
              isActive: true,
              availability: 'AVAILABLE',
            },
          },
        },
      },
    },
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    } as Prisma.BrandOrderByWithRelationInput,
  },

  // Chat session query
  chatSession: {
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
        take: 100, // Limit message history
      },
      comparisons: {
        include: {
          phone1: {
            select: {
              id: true,
              model: true,
              brand: { select: { name: true } },
            },
          },
          phone2: {
            select: {
              id: true,
              model: true,
              brand: { select: { name: true } },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Limit comparison history
      },
    },
  },

  // Comparison query
  comparison: {
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
  },
} as const;

/**
 * Query builder for complex phone searches
 */
export class PhoneQueryBuilder {
  private whereClause: Prisma.PhoneWhereInput = { isActive: true };
  private selectClause?: Prisma.PhoneSelect;
  private includeClause?: Prisma.PhoneInclude;
  private orderByClause: Prisma.PhoneOrderByWithRelationInput[] = [];
  private limitClause?: number;
  private offsetClause?: number;

  /**
   * Filter by brand
   */
  filterByBrand(brandName: string): this {
    this.whereClause = {
      ...this.whereClause,
      brand: {
        name: {
          equals: brandName,
          mode: 'insensitive',
        },
      },
    };
    return this;
  }

  /**
   * Filter by model (partial match)
   */
  filterByModel(model: string): this {
    this.whereClause = {
      ...this.whereClause,
      model: {
        contains: model,
        mode: 'insensitive',
      },
    };
    return this;
  }

  /**
   * Filter by price range
   */
  filterByPriceRange(minPrice?: number, maxPrice?: number): this {
    const priceFilter: any = {};
    
    if (minPrice !== undefined) {
      priceFilter.gte = minPrice;
    }
    
    if (maxPrice !== undefined) {
      priceFilter.lte = maxPrice;
    }
    
    if (Object.keys(priceFilter).length > 0) {
      this.whereClause = {
        ...this.whereClause,
        currentPrice: priceFilter,
      };
    }
    
    return this;
  }

  /**
   * Filter by availability
   */
  filterByAvailability(availability: 'AVAILABLE' | 'DISCONTINUED' | 'UPCOMING'): this {
    this.whereClause = {
      ...this.whereClause,
      availability,
    };
    return this;
  }

  /**
   * Filter by launch date range
   */
  filterByLaunchDate(startDate?: Date, endDate?: Date): this {
    const dateFilter: any = {};
    
    if (startDate) {
      dateFilter.gte = startDate;
    }
    
    if (endDate) {
      dateFilter.lte = endDate;
    }
    
    if (Object.keys(dateFilter).length > 0) {
      this.whereClause = {
        ...this.whereClause,
        launchDate: dateFilter,
      };
    }
    
    return this;
  }

  /**
   * Full-text search across model and brand
   */
  search(query: string): this {
    const searchTerms = query.trim().toLowerCase().split(' ');
    
    this.whereClause = {
      ...this.whereClause,
      OR: [
        {
          model: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          brand: {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
        {
          variant: {
            contains: query,
            mode: 'insensitive',
          },
        },
        // Add more complex search logic for multiple terms
        ...searchTerms.map(term => ({
          OR: [
            {
              model: {
                contains: term,
                mode: 'insensitive' as const,
              },
            },
            {
              brand: {
                name: {
                  contains: term,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        })),
      ],
    };
    
    return this;
  }

  /**
   * Set select fields
   */
  select(fields: Prisma.PhoneSelect): this {
    this.selectClause = fields;
    this.includeClause = undefined; // Clear include if select is used
    return this;
  }

  /**
   * Set include relations
   */
  include(relations: Prisma.PhoneInclude): this {
    this.includeClause = relations;
    this.selectClause = undefined; // Clear select if include is used
    return this;
  }

  /**
   * Set ordering
   */
  orderBy(orderBy: Prisma.PhoneOrderByWithRelationInput[]): this {
    this.orderByClause = orderBy;
    return this;
  }

  /**
   * Set limit
   */
  limit(limit: number): this {
    this.limitClause = limit;
    return this;
  }

  /**
   * Set offset for pagination
   */
  offset(offset: number): this {
    this.offsetClause = offset;
    return this;
  }

  /**
   * Build the final query object
   */
  build(): Prisma.PhoneFindManyArgs {
    const query: Prisma.PhoneFindManyArgs = {
      where: this.whereClause,
    };

    if (this.selectClause) {
      query.select = this.selectClause;
    } else if (this.includeClause) {
      query.include = this.includeClause;
    }

    if (this.orderByClause.length > 0) {
      query.orderBy = this.orderByClause;
    }

    if (this.limitClause) {
      query.take = this.limitClause;
    }

    if (this.offsetClause) {
      query.skip = this.offsetClause;
    }

    return query;
  }

  /**
   * Build count query for pagination
   */
  buildCount(): Prisma.PhoneCountArgs {
    return {
      where: this.whereClause,
    };
  }
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create paginated query
 */
export function createPaginatedQuery(
  options: PaginationOptions
): { skip: number; take: number } {
  const { page, limit } = options;
  const skip = (page - 1) * limit;
  
  return { skip, take: limit };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginatedResult<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static queries: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static startTimer(queryName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.recordQuery(queryName, duration);
    };
  }

  private static recordQuery(queryName: string, duration: number): void {
    const existing = this.queries.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count += 1;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.queries.set(queryName, existing);
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
  }

  static getStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.queries);
  }

  static reset(): void {
    this.queries.clear();
  }
}

/**
 * Optimized query wrapper with monitoring
 */
export async function executeOptimizedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const stopTimer = QueryPerformanceMonitor.startTimer(queryName);
  
  try {
    const result = await queryFn();
    return result;
  } finally {
    stopTimer();
  }
}