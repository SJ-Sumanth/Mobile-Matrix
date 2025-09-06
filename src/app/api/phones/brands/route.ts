import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../services/phone.js';
import { createAPIResponse } from '../../../../utils/api.js';
import { withRateLimit } from '../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';

/**
 * GET /api/phones/brands - Get all available phone brands
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      const brands = await phoneService.getAllBrands();
      return createAPIResponse(brands, 'Brands retrieved successfully');
    })(request);
  })(request);
}