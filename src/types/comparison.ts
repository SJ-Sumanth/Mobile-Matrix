import { z } from 'zod';
import { PhoneSchema, PhoneScoresSchema } from './phone';

// Comparison winner enum
export const ComparisonWinnerSchema = z.enum(['phone1', 'phone2', 'tie']);
export type ComparisonWinner = z.infer<typeof ComparisonWinnerSchema>;

// Specification comparison schema and type
export const SpecComparisonSchema = z.object({
  category: z.string(),
  phone1Value: z.any(),
  phone2Value: z.any(),
  winner: ComparisonWinnerSchema.optional(),
  difference: z.string().optional(),
  importance: z.enum(['high', 'medium', 'low']).default('medium'),
});

export type SpecComparison = z.infer<typeof SpecComparisonSchema>;

// Comparison category schema and type
export const ComparisonCategorySchema = z.object({
  name: z.string(),
  displayName: z.string(),
  weight: z.number().min(0).max(1),
  comparisons: z.array(SpecComparisonSchema),
  winner: ComparisonWinnerSchema.optional(),
  summary: z.string().optional(),
});

export type ComparisonCategory = z.infer<typeof ComparisonCategorySchema>;

// Comparison insights schema and type
export const ComparisonInsightsSchema = z.object({
  strengths: z.object({
    phone1: z.array(z.string()),
    phone2: z.array(z.string()),
  }),
  weaknesses: z.object({
    phone1: z.array(z.string()),
    phone2: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
  bestFor: z.object({
    phone1: z.array(z.string()),
    phone2: z.array(z.string()),
  }),
});

export type ComparisonInsights = z.infer<typeof ComparisonInsightsSchema>;

// Main comparison result schema and type
export const ComparisonResultSchema = z.object({
  id: z.string(),
  phones: z.tuple([PhoneSchema, PhoneSchema]),
  categories: z.array(ComparisonCategorySchema),
  scores: z.object({
    phone1: PhoneScoresSchema,
    phone2: PhoneScoresSchema,
  }),
  overallWinner: ComparisonWinnerSchema.optional(),
  insights: ComparisonInsightsSchema,
  summary: z.string(),
  generatedAt: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;

// Multi-phone comparison schema for comparing more than 2 phones
export const MultiPhoneComparisonSchema = z.object({
  id: z.string(),
  phones: z.array(PhoneSchema).min(2).max(5), // Support up to 5 phones
  categories: z.array(ComparisonCategorySchema),
  scores: z.record(z.string(), PhoneScoresSchema), // phoneId -> scores
  rankings: z.array(z.object({
    phoneId: z.string(),
    rank: z.number(),
    totalScore: z.number(),
  })),
  insights: ComparisonInsightsSchema,
  summary: z.string(),
  generatedAt: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type MultiPhoneComparison = z.infer<typeof MultiPhoneComparisonSchema>;

// Comparison request schema and type
export const ComparisonRequestSchema = z.object({
  phone1Id: z.string(),
  phone2Id: z.string(),
  userId: z.string().optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    weights: z.record(z.string(), z.number()).optional(),
  }).optional(),
});

export type ComparisonRequest = z.infer<typeof ComparisonRequestSchema>;

// Saved comparison schema and type
export const SavedComparisonSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string().optional(),
  result: z.union([ComparisonResultSchema, MultiPhoneComparisonSchema]),
  isPublic: z.boolean().default(false),
  shareUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SavedComparison = z.infer<typeof SavedComparisonSchema>;

// Comparison history entry
export const ComparisonHistoryEntrySchema = z.object({
  id: z.string(),
  phoneIds: z.array(z.string()),
  phoneNames: z.array(z.string()),
  comparisonType: z.enum(['two-phone', 'multi-phone']),
  timestamp: z.date(),
  shareUrl: z.string().optional(),
});

export type ComparisonHistoryEntry = z.infer<typeof ComparisonHistoryEntrySchema>;

// Share comparison data
export const ShareComparisonSchema = z.object({
  id: z.string(),
  shareToken: z.string(),
  title: z.string(),
  description: z.string(),
  phoneNames: z.array(z.string()),
  url: z.string(),
  imageUrl: z.string().optional(),
  expiresAt: z.date().optional(),
});

export type ShareComparison = z.infer<typeof ShareComparisonSchema>;
