import { NextRequest, NextResponse } from 'next/server';
import { phoneService } from '../../../../services/phone.js';
import { createAPIResponse, createAPIError } from '../../../../utils/api.js';
import { withRateLimit } from '../../../../middleware/rateLimit.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';

/**
 * GET /api/phones/[id] - Get phone by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      const { id } = params;
      
      if (!id) {
        return createAPIError('MISSING_PHONE_ID', 'Phone ID is required', 400);
      }

      const phone = await phoneService.getPhoneById(id);
      
      if (!phone) {
        return createAPIError('PHONE_NOT_FOUND', 'Phone not found', 404);
      }

      return createAPIResponse(phone, 'Phone retrieved successfully');
    })(request);
  })(request);
}