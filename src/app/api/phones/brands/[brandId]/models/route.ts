import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../../../utils/api.js';
import { withRateLimit } from '../../../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../../../middleware/errorHandler.js';

/**
 * GET /api/phones/brands/[brandId]/models - Get models by brand ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      const { brandId } = params;
      
      if (!brandId) {
        return createAPIError('MISSING_BRAND_ID', 'Brand ID is required', 400);
      }

      const models = await phoneService.getModelsByBrand(brandId);
      return createAPIResponse(models, 'Models retrieved successfully');
    })(request);
  })(request);
}