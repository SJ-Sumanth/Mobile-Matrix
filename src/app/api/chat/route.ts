import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { testAI } from '../../../services/testAI.js';
import { createAPIResponse, createAPIError } from '../../../utils/api.js';
import { withChatRateLimit } from '../../../middleware/rateLimit.js';
import { withValidation } from '../../../middleware/validation.js';
import { withErrorHandler } from '../../../middleware/errorHandler.js';
import { withCORS, withSecurityHeaders } from '../../../middleware/cors.js';
import { ChatContextSchema } from '../../../types/chat.js';

// Chat message request schema
const ChatMessageRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: ChatContextSchema,
});

/**
 * POST /api/chat - Process chat message with AI
 */
export async function POST(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withChatRateLimit(
          withValidation(ChatMessageRequestSchema, async (validatedData) => {
            const { message, context } = validatedData;
            
            // Process message with AI service
            const aiResponse = await testAI.processMessage(message, context);
            
            return NextResponse.json(
              createAPIResponse(aiResponse, 'Message processed successfully'),
              { status: 200 }
            );
          })
        )
      )
    )(request)
  )(request);
}