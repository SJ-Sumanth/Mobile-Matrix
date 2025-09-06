import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAPIResponse, createAPIError } from '@/utils/api';
import { withRateLimit } from '@/middleware/rateLimit';
import { withValidation } from '@/middleware/validation';
import { withErrorHandler } from '@/middleware/errorHandler';
import { comparisonManager } from '@/services/comparisonManager';

// Start new comparison schema
const StartComparisonSchema = z.object({
  phoneIds: z.array(z.string()).min(2).max(5),
  userId: z.string().optional(),
});

// Save comparison schema
const SaveComparisonSchema = z.object({
  comparisonId: z.string(),
  title: z.string().optional(),
  userId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Modify comparison schema
const ModifyComparisonSchema = z.object({
  comparisonId: z.string(),
  phoneIndex: z.number().min(0).max(4),
  newPhoneId: z.string(),
});

/**
 * POST /api/comparison/manage - Start a new comparison
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      return withValidation(StartComparisonSchema, async (validatedData) => {
        const { phoneIds, userId } = validatedData;
        
        try {
          const comparison = await comparisonManager.startNewComparison(phoneIds);
          
          return createAPIResponse(comparison, 'Comparison started successfully');
        } catch (error) {
          return createAPIError(
            'COMPARISON_ERROR',
            error instanceof Error ? error.message : 'Failed to start comparison',
            400
          );
        }
      })(request);
    })(request);
  })(request);
}

/**
 * PUT /api/comparison/manage - Save or modify comparison
 */
export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(async () => {
      const body = await request.json();
      
      // Determine if this is a save or modify operation
      if (body.title !== undefined || body.tags !== undefined) {
        // Save operation
        return withValidation(SaveComparisonSchema, async (validatedData) => {
          const { comparisonId, title, userId, tags } = validatedData;
          
          try {
            // This would need to be implemented in the comparison manager
            const savedComparison = await comparisonManager.saveComparison(
              { id: comparisonId } as any, // This needs proper implementation
              title,
              userId
            );
            
            return createAPIResponse(savedComparison, 'Comparison saved successfully');
          } catch (error) {
            return createAPIError(
              'SAVE_ERROR',
              error instanceof Error ? error.message : 'Failed to save comparison',
              400
            );
          }
        })({ json: async () => body } as NextRequest);
      } else {
        // Modify operation
        return withValidation(ModifyComparisonSchema, async (validatedData) => {
          const { comparisonId, phoneIndex, newPhoneId } = validatedData;
          
          try {
            const modifiedComparison = await comparisonManager.modifyComparison(
              comparisonId,
              phoneIndex,
              newPhoneId
            );
            
            return createAPIResponse(modifiedComparison, 'Comparison modified successfully');
          } catch (error) {
            return createAPIError(
              'MODIFY_ERROR',
              error instanceof Error ? error.message : 'Failed to modify comparison',
              400
            );
          }
        })({ json: async () => body } as NextRequest);
      }
    })(request);
  })(request);
}