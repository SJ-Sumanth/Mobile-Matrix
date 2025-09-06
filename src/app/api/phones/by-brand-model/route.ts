import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../utils/api.js';
import { withRateLimit } from '../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../../middleware/cors.js';
import { sanitizeBrandName, sanitizePhoneModel, validateBrandName, validatePhoneModel } from '../../../../utils/validation.js';

/**
 * GET /api/phones/by-brand-model - Get phone by brand and model
 */
export async function GET(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withRateLimit(async () => {
          const { searchParams } = new URL(request.url);
          const brand = searchParams.get('brand');
          const model = searchParams.get('model');
          const variant = searchParams.get('variant');
          
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
          const sanitizedVariant = variant ? sanitizePhoneModel(variant) : undefined;
          
          if (!validateBrandName(sanitizedBrand) || !validatePhoneModel(sanitizedModel)) {
            return NextResponse.json(
              createAPIError('INVALID_PARAMETERS', 'Invalid brand or model format', 400),
              { status: 400 }
            );
          }

          if (sanitizedVariant && !validatePhoneModel(sanitizedVariant)) {
            return NextResponse.json(
              createAPIError('INVALID_VARIANT', 'Invalid variant format', 400),
              { status: 400 }
            );
          }

          try {
            const phone = await phoneService.getPhoneByModel(sanitizedBrand, sanitizedModel);
            
            if (!phone) {
              return NextResponse.json(
                createAPIError('PHONE_NOT_FOUND', 'Phone not found', 404),
                { status: 404 }
              );
            }

            // If variant is specified, check if it matches
            if (sanitizedVariant && phone.variant !== sanitizedVariant) {
              return NextResponse.json(
                createAPIError('VARIANT_NOT_FOUND', 'Phone variant not found', 404),
                { status: 404 }
              );
            }

            return NextResponse.json(
              createAPIResponse(phone, 'Phone retrieved successfully'),
              { status: 200 }
            );
          } catch (error) {
            console.error('Error getting phone by brand and model:', error);
            return NextResponse.json(
              createAPIError('FETCH_FAILED', 'Failed to get phone', 500),
              { status: 500 }
            );
          }
        })
      )
    )(request)
  )(request);
}