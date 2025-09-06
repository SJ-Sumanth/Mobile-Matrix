import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAPIResponse, createAPIError } from '@/utils/api';
import { withRateLimit } from '@/middleware/rateLimit';
import { withErrorHandler } from '@/middleware/errorHandler';
import { comparisonManager } from '@/services/comparisonManager';

/**
 * GET /api/comparison/history - Get comparison history
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      
      try {
        const history = comparisonManager.getComparisonHistory();
        
        return createAPIResponse(history, 'History retrieved successfully');
      } catch (error) {
        return createAPIError(
          'HISTORY_ERROR',
          error instanceof Error ? error.message : 'Failed to retrieve history',
          500
        );
      }
    })(request);
  })(request);
}

/**
 * DELETE /api/comparison/history - Clear comparison history
 */
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      try {
        comparisonManager.clearHistory();
        
        return createAPIResponse(null, 'History cleared successfully');
      } catch (error) {
        return createAPIError(
          'CLEAR_ERROR',
          error instanceof Error ? error.message : 'Failed to clear history',
          500
        );
      }
    })(request);
  })(request);
}