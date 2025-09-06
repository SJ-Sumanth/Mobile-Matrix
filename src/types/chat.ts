import { z } from 'zod';

// Chat message role enum
export const ChatMessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

// Chat message schema and type
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Chat step enum
export const ChatStepSchema = z.enum(['brand_selection', 'model_selection', 'comparison', 'completed']);
export type ChatStep = z.infer<typeof ChatStepSchema>;

// User preferences schema and type
export const UserPreferencesSchema = z.object({
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  priorities: z.array(z.enum(['camera', 'battery', 'performance', 'display', 'price'])).optional(),
  usage: z.enum(['gaming', 'photography', 'business', 'casual']).optional(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Chat context schema and type
export const ChatContextSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  conversationHistory: z.array(ChatMessageSchema),
  currentStep: ChatStepSchema,
  selectedBrand: z.string().optional(),
  selectedPhones: z.array(z.string()),
  preferences: UserPreferencesSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChatContext = z.infer<typeof ChatContextSchema>;

// AI response schema and type
export const AIResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()).optional(),
  nextStep: ChatStepSchema.optional(),
  extractedData: z.record(z.string(), z.any()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// Chat session schema and type
export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  context: ChatContextSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;
