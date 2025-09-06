import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAPIResponse, createAPIError } from '@/utils/api';
import { withRateLimit } from '@/middleware/rateLimit';
import { withValidation } from '@/middleware/validation';
import { withErrorHandler } from '@/middleware/errorHandler';
import { comparisonManager } from '@/services/comparisonManager';

// Generate share URL schema
const GenerateShareSchema = z.object({
  comparisonId: z.string(),
  platform: z.enum(['twitter', 'facebook', 'whatsapp', 'linkedin', 'copy']).optional(),
});

/**
 * POST /api/comparison/share - Generate share URL or social media link
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      return withValidation(GenerateShareSchema, async (validatedData) => {
        const { comparisonId, platform } = validatedData;
        
        try {
          // This would need to fetch the actual comparison first
          const comparison = { id: comparisonId } as any; // Placeholder
          
          if (platform && platform !== 'copy') {
            const shareUrl = await comparisonManager.shareToSocialMedia(comparison, platform);
            return createAPIResponse({ shareUrl }, 'Social media share URL generated');
          } else {
            const shareData = await comparisonManager.generateShareUrl(comparison);
            return createAPIResponse(shareData, 'Share URL generated successfully');
          }
        } catch (error) {
          return createAPIError(
            'SHARE_ERROR',
            error instanceof Error ? error.message : 'Failed to generate share URL',
            400
          );
        }
      })(request);
    })(request);
  })(request);
}