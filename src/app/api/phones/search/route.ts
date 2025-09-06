import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../services/phone.js';
import { SearchQuerySchema } from '../../../../types/api.js';
import { createAPIResponse, createAPIError } from '../../../../utils/api.js';
import { withSearchRateLimit } from '../../../../middleware/rateLimit.js';
import { withValidation } from '../../../../middleware/validation.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../../middleware/cors.js';

/**
 * GET /api/phones/search - Search phones by query
 */
export async function GET(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withSearchRateLimit(
          withValidation(SearchQuerySchema, async (validatedQuery) => {
            const { q, page, limit } = validatedQuery;
            
            if (!q || q.trim().length < 2) {
              return NextResponse.json(
                createAPIError('INVALID_QUERY', 'Search query must be at least 2 characters long', 400),
                { status: 400 }
              );
            }

            const phones = await phoneService.searchPhones(q);
            
            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedPhones = phones.slice(startIndex, endIndex);
            
            const response = {
              items: paginatedPhones,
              meta: {
                page,
                limit,
                total: phones.length,
                totalPages: Math.ceil(phones.length / limit),
                hasNext: endIndex < phones.length,
                hasPrev: page > 1,
              },
            };

            return NextResponse.json(
              createAPIResponse(response, 'Phones retrieved successfully'),
              { status: 200 }
            );
          })
        )
      )
    )(request)
  )(request);
}