import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../utils/api.js';
import { withRateLimit } from '../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../../middleware/cors.js';
import { PhoneSelectionSchema } from '../../../../types/phone.js';
import { sanitizeBrandName, sanitizePhoneModel } from '../../../../utils/validation.js';

/**
 * POST /api/phones/validate - Validate phone selection against database
 */
export async function POST(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withRateLimit(async () => {
          try {
            const body = await request.json();
            
            // Validate request body
            const validationResult = PhoneSelectionSchema.safeParse(body);
            if (!validationResult.success) {
              return NextResponse.json(
                createAPIError('INVALID_REQUEST', 'Invalid phone selection format', 400, {
                  errors: validationResult.error.issues,
                }),
                { status: 400 }
              );
            }

            const { brand, model, variant } = validationResult.data;
            
            // Sanitize inputs
            const sanitizedBrand = sanitizeBrandName(brand);
            const sanitizedModel = sanitizePhoneModel(model);
            const sanitizedVariant = variant ? sanitizePhoneModel(variant) : undefined;

            // Try to find the exact phone
            const phone = await phoneService.getPhoneByModel(sanitizedBrand, sanitizedModel);
            
            if (!phone) {
              return NextResponse.json(
                createAPIError('PHONE_NOT_FOUND', 'Phone not found in database', 404),
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
              createAPIResponse(
                { 
                  phone,
                  isValid: true,
                  message: 'Phone selection is valid'
                },
                'Phone validated successfully'
              ),
              { status: 200 }
            );
          } catch (error) {
            console.error('Error validating phone selection:', error);
            return NextResponse.json(
              createAPIError('VALIDATION_FAILED', 'Failed to validate phone selection', 500),
              { status: 500 }
            );
          }
        })
      )
    )(request)
  )(request);
}