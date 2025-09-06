import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '../../../lib/middleware/errorHandler.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { withSecurityHeaders } from '../../../lib/middleware/security.js';
import { withCORS } from '../../../lib/middleware/cors.js';
import { externalDataService } from '../../../services/external/index.js';
import { z } from 'zod';

// Request validation schemas
const SyncRequestSchema = z.object({
  sources: z.array(z.enum(['gsmarena', 'priceTracking'])).optional(),
  phoneIds: z.array(z.string()).optional(),
  force: z.boolean().default(false),
});

const PhoneSyncRequestSchema = z.object({
  phoneId: z.string().min(1, 'Phone ID is required'),
});

/**
 * GET /api/sync - Get sync status and metrics
 */
export async function GET(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withRateLimit(async () => {
          try {
            const { searchParams } = new URL(request.url);
            const includeEvents = searchParams.get('events') === 'true';
            const includeMetrics = searchParams.get('metrics') === 'true';
            const hoursBack = parseInt(searchParams.get('hours') || '24', 10);

            const healthStatus = externalDataService.getHealthStatus();
            const response: any = {
              status: 'success',
              data: {
                health: healthStatus,
                timestamp: new Date().toISOString(),
              },
            };

            if (includeMetrics) {
              response.data.metrics = externalDataService.getMetrics();
            }

            if (includeEvents) {
              response.data.recentEvents = externalDataService.getRecentEvents(hoursBack);
            }

            return NextResponse.json(response, { status: 200 });
          } catch (error) {
            console.error('Error getting sync status:', error);
            return NextResponse.json(
              {
                status: 'error',
                message: 'Failed to get sync status',
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

/**
 * POST /api/sync - Start data synchronization
 */
export async function POST(request: NextRequest) {
  return withCORS()(
    withSecurityHeaders()(
      withErrorHandler(
        withRateLimit(async () => {
          try {
            const body = await request.json();
            const validatedData = SyncRequestSchema.parse(body);

            // Check if a sync is already running
            const activeSyncJobs = externalDataService.getMetrics();
            if (activeSyncJobs && Object.keys(activeSyncJobs).length > 0) {
              return NextResponse.json(
                {
                  status: 'error',
                  message: 'Sync operation already in progress',
                },
                { status: 409 }
              );
            }

            // Start the sync operation
            const syncPromise = externalDataService.performFullSync();
            
            // Don't await the sync - return immediately with job info
            syncPromise.catch(error => {
              console.error('Background sync failed:', error);
            });

            return NextResponse.json(
              {
                status: 'success',
                message: 'Data synchronization started',
                data: {
                  syncStarted: true,
                  sources: validatedData.sources || ['gsmarena', 'priceTracking'],
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 202 }
            );
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

            console.error('Error starting sync:', error);
            return NextResponse.json(
              {
                status: 'error',
                message: 'Failed to start synchronization',
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