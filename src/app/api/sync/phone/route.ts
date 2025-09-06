import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '../../../../lib/middleware/errorHandler.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withSecurityHeaders } from '../../../../lib/middleware/security.js';
import { withCORS } from '../../../../lib/middleware/cors.js';
import { externalDataService } from '../../../../services/external/index.js';
import { z } from 'zod';

// Request validation schema
const PhoneSyncRequestSchema = z.object({
  phoneId: z.string().min(1, 'Phone ID is required'),
});

/**
 * POST /api/sync/phone - Sync data for a specific phone
 */
export async function POST(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withRateLimit(async () => {
          try {
            const body = await request.json();
            const { phoneId } = PhoneSyncRequestSchema.parse(body);

            // Sync the specific phone
            const success = await externalDataService.syncPhoneData(phoneId);

            if (success) {
              return NextResponse.json(
                {
                  status: 'success',
                  message: 'Phone data synchronized successfully',
                  data: {
                    phoneId,
                    syncedAt: new Date().toISOString(),
                  },
                },
                { status: 200 }
              );
            } else {
              return NextResponse.json(
                {
                  status: 'error',
                  message: 'Failed to synchronize phone data',
                  data: { phoneId },
                },
                { status: 500 }
              );
            }
          } catch (error) {
            if (error instanceof z.ZodError) {
              return NextResponse.json(
                {
                  status: 'error',
                  message: 'Invalid request data',
                  errors: error.errors,
                },
                { status: 400 }
              );
            }

            console.error('Error syncing phone data:', error);
            return NextResponse.json(
              {
                status: 'error',
                message: 'Failed to sync phone data',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
              { status: 500 }
            );
          }
        })
      )
    )
  );
}