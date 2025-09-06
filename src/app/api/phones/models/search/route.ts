import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../../utils/api.js';
import { withSearchRateLimit } from '../../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../../../middleware/cors.js';
import { sanitizeBrandName, sanitizePhoneModel, validateBrandName, validatePhoneModel } from '../../../../../utils/validation.js';

/**
 * GET /api/phones/models/search - Search phone models for a specific brand
 */
export async function GET(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withSearchRateLimit(async () => {
          const { searchParams } = new URL(request.url);
          const brand = searchParams.get('brand');
          const query = searchParams.get('q');
          
          if (!brand) {
            return NextResponse.json(
              createAPIError('MISSING_BRAND', 'Brand parameter is required', 400),
              { status: 400 }
            );
          }

          if (!query) {
            return NextResponse.json(
              createAPIError('MISSING_QUERY', 'Search query is required', 400),
              { status: 400 }
            );
          }

          const sanitizedBrand = sanitizeBrandName(brand);
          const sanitizedQuery = sanitizePhoneModel(query);
          
          if (!validateBrandName(sanitizedBrand)) {
            return NextResponse.json(
              createAPIError('INVALID_BRAND', 'Invalid brand name format', 400),
              { status: 400 }
            );
          }

          if (!validatePhoneModel(sanitizedQuery)) {
            return NextResponse.json(
              createAPIError('INVALID_QUERY', 'Invalid model name format', 400),
              { status: 400 }
            );
          }

          try {
            // Get phones by brand and filter by model query
            const phones = await phoneService.getPhonesByBrand(sanitizedBrand);
            
            if (phones.length === 0) {
              return NextResponse.json(
                createAPIError('BRAND_NOT_FOUND', 'Brand not found or has no phones', 404),
                { status: 404 }
              );
            }

            // Extract unique model names and filter by query
            const modelSet = new Set<string>();
            phones.forEach(phone => {
              if (phone.model.toLowerCase().includes(sanitizedQuery.toLowerCase())) {
                modelSet.add(phone.model);
              }
            });

            const models = Array.from(modelSet);

            // Sort by relevance (exact matches first, then starts with, then contains)
            const sortedModels = models.sort((a, b) => {
              const aLower = a.toLowerCase();
              const bLower = b.toLowerCase();
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
            const limitedModels = sortedModels.slice(0, 15);

            return NextResponse.json(
              createAPIResponse(limitedModels, 'Models retrieved successfully'),
              { status: 200 }
            );
          } catch (error) {
            console.error('Error searching models:', error);
            return NextResponse.json(
              createAPIError('SEARCH_FAILED', 'Failed to search models', 500),
              { status: 500 }
            );
          }
        })
      )
    )(request)
  )(request);
}