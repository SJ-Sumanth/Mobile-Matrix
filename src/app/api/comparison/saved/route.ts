import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAPIResponse, createAPIError } from '@/utils/api';
import { withRateLimit } from '@/middleware/rateLimit';
import { withValidation } from '@/middleware/validation';
import { withErrorHandler } from '@/middleware/errorHandler';
import { comparisonManager } from '@/services/comparisonManager';

/**
 * GET /api/comparison/saved - Get saved comparisons
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const search = searchParams.get('search');
      
      try {
        let savedComparisons;
        
        if (search) {
          savedComparisons = comparisonManager.searchSavedComparisons(search, userId || undefined);
        } else {
          savedComparisons = comparisonManager.getSavedComparisons(userId || undefined);
        }
        
        return createAPIResponse(savedComparisons, 'Saved comparisons retrieved successfully');
      } catch (error) {
        return createAPIError(
          'SAVED_ERROR',
          error instanceof Error ? error.message : 'Failed to retrieve saved comparisons',
          500
        );
      }
    })(request);
  })(request);
}

// Delete saved comparison schema
const DeleteSavedSchema = z.object({
  comparisonId: z.string(),
  userId: z.string().optional(),
});

/**
 * DELETE /api/comparison/saved - Delete a saved comparison
 */
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      return withValidation(DeleteSavedSchema, async (validatedData) => {
        const { comparisonId, userId } = validatedData;
        
        try {
          const success = comparisonManager.deleteSavedComparison(comparisonId, userId);
          
          if (success) {
            return createAPIResponse(null, 'Saved comparison deleted successfully');
          } else {
            return createAPIError(
              'NOT_FOUND',
              'Saved comparison not found or access denied',
              404
            );
          }
        } catch (error) {
          return createAPIError(
            'DELETE_ERROR',
            error instanceof Error ? error.message : 'Failed to delete saved comparison',
            500
          );
        }
      })(request);
    })(request);
  })(request);
}