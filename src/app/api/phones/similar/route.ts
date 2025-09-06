import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../utils/api.js';
import { withSearchRateLimit } from '../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../../middleware/cors.js';
import { sanitizeBrandName, sanitizePhoneModel, validateBrandName, validatePhoneModel } from '../../../../utils/validation.js';

/**
 * GET /api/phones/similar - Get similar phones for suggestions
 */
export async function GET(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withSearchRateLimit(async () => {
          const { searchParams } = new URL(request.url);
          const brand = searchParams.get('brand');
          const model = searchParams.get('model');
          const limit = parseInt(searchParams.get('limit') || '5', 10);
          
          if (!brand) {
            return NextResponse.json(
              createAPIError('MISSING_BRAND', 'Brand parameter is required', 400),
              { status: 400 }
            );
          }

          if (!model) {
            return NextResponse.json(
              createAPIError('MISSING_MODEL', 'Model parameter is required', 400),
              { status: 400 }
            );
          }

          const sanitizedBrand = sanitizeBrandName(brand);
          const sanitizedModel = sanitizePhoneModel(model);
          
          if (!validateBrandName(sanitizedBrand) || !validatePhoneModel(sanitizedModel)) {
            return NextResponse.json(
              createAPIError('INVALID_PARAMETERS', 'Invalid brand or model format', 400),
              { status: 400 }
            );
          }

          try {
            // First try to find the exact phone to get similar ones
            const targetPhone = await phoneService.getPhoneByModel(sanitizedBrand, sanitizedModel);
            
            let similarPhones = [];
            
            if (targetPhone) {
              // Get similar phones based on the target phone
              similarPhones = await phoneService.getSimilarPhones(targetPhone, limit);
            } else {
              // If exact phone not found, search for phones with similar names
              const searchResults = await phoneService.searchPhones(`${sanitizedBrand} ${sanitizedModel}`);
              similarPhones = searchResults.slice(0, limit);
              
              // Also try to get phones from the same brand
              if (similarPhones.length < limit) {
                const brandPhones = await phoneService.getPhonesByBrand(sanitizedBrand);
                const additionalPhones = brandPhones
                  .filter(phone => !similarPhones.some(sp => sp.id === phone.id))
                  .slice(0, limit - similarPhones.length);
                similarPhones.push(...additionalPhones);
              }
            }

            return NextResponse.json(
              createAPIResponse(similarPhones, 'Similar phones retrieved successfully'),
              { status: 200 }
            );
          } catch (error) {
            console.error('Error getting similar phones:', error);
            return NextResponse.json(
              createAPIError('SEARCH_FAILED', 'Failed to get similar phones', 500),
              { status: 500 }
            );
          }
        })
      )
    )(request)
  )(request);
}