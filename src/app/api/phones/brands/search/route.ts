import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../../utils/api.js';
import { withSearchRateLimit } from '../../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../../../middleware/cors.js';
import { sanitizeBrandName, validateBrandName } from '../../../../../utils/validation.js';

/**
 * GET /api/phones/brands/search - Search brands with autocomplete
 */
export async function GET(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withSearchRateLimit(async () => {
          const { searchParams } = new URL(request.url);
          const query = searchParams.get('q');
          
          if (!query) {
            return NextResponse.json(
              createAPIError('MISSING_QUERY', 'Search query is required', 400),
              { status: 400 }
            );
          }

          const sanitizedQuery = sanitizeBrandName(query);
          
          if (!validateBrandName(sanitizedQuery)) {
            return NextResponse.json(
              createAPIError('INVALID_QUERY', 'Invalid brand name format', 400),
              { status: 400 }
            );
          }

          if (sanitizedQuery.length < 2) {
            return NextResponse.json(
              createAPIError('QUERY_TOO_SHORT', 'Search query must be at least 2 characters long', 400),
              { status: 400 }
            );
          }

          try {
            // Get all brands and filter by query
            const allBrands = await phoneService.getAllBrands();
            const filteredBrands = allBrands.filter(brand =>
              brand.name.toLowerCase().includes(sanitizedQuery.toLowerCase())
            );

            // Sort by relevance (exact matches first, then starts with, then contains)
            const sortedBrands = filteredBrands.sort((a, b) => {
              const aLower = a.name.toLowerCase();
              const bLower = b.name.toLowerCase();
              const queryLower = sanitizedQuery.toLowerCase();
              
              // Exact match
              if (aLower === queryLower) return -1;
              if (bLower === queryLower) return 1;
              
              // Starts with
              if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
              if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;
              
              // Alphabetical
              return aLower.localeCompare(bLower);
            });

            // Limit results for performance
            const limitedBrands = sortedBrands.slice(0, 10);

            return NextResponse.json(
              createAPIResponse(limitedBrands, 'Brands retrieved successfully'),
              { status: 200 }
            );
          } catch (error) {
            console.error('Error searching brands:', error);
            return NextResponse.json(
              createAPIError('SEARCH_FAILED', 'Failed to search brands', 500),
              { status: 500 }
            );
          }
        })
      )
    )(request)
  )(request);
}