import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { phoneService } from '../../../services/phone.js';
import { comparisonService } from '../../../services/comparison.js';
import { createAPIResponse, createAPIError } from '../../../utils/api.js';
import { withRateLimit } from '../../../middleware/rateLimit.js';
import { withValidation } from '../../../middleware/validation.js';
import { withErrorHandler } from '../../../middleware/errorHandler.js';

// Comparison request schema
const ComparisonRequestSchema = z.object({
  phone1Id: z.string().min(1, 'Phone 1 ID is required'),
  phone2Id: z.string().min(1, 'Phone 2 ID is required'),
  categories: z.array(z.string()).optional(),
});

/**
 * POST /api/comparison - Compare two phones
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      return withValidation(ComparisonRequestSchema, async (validatedData) => {
        const { phone1Id, phone2Id, categories } = validatedData;
        
        // Get both phones
        const [phone1, phone2] = await Promise.all([
          phoneService.getPhoneById(phone1Id),
          phoneService.getPhoneById(phone2Id),
        ]);
        
        if (!phone1) {
          return createAPIError('PHONE_NOT_FOUND', `Phone with ID ${phone1Id} not found`, 404);
        }
        
        if (!phone2) {
          return createAPIError('PHONE_NOT_FOUND', `Phone with ID ${phone2Id} not found`, 404);
        }
        
        // Generate comparison
        const comparison = await comparisonService.comparePhones(phone1, phone2);
        
        return createAPIResponse(comparison, 'Comparison generated successfully');
      })(request);
    })(request);
  })(request);
}