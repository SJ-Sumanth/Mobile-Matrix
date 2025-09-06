import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '../../../../services/ai.js';
import { createAPIResponse, createAPIError } from '../../../../utils/api.js';
import { withRateLimit } from '../../../../middleware/rateLimit.js';
import { withValidation } from '../../../../middleware/validation.js';
import { withErrorHandler } from '../../../../middleware/errorHandler.js';

// Phone extraction request schema
const PhoneExtractionRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

/**
 * POST /api/chat/extract-phone - Extract phone selection from user message
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      return withValidation(PhoneExtractionRequestSchema, async (validatedData) => {
        const { message } = validatedData;
        
        // Extract phone selection using AI service
        const phoneSelection = await aiService.instance.extractPhoneSelection(message);
        
        if (!phoneSelection) {
          return createAPIError('NO_PHONE_DETECTED', 'No phone selection detected in message', 400);
        }
        
        return createAPIResponse(phoneSelection, 'Phone selection extracted successfully');
      })(request);
    })(request);
  })(request);
}