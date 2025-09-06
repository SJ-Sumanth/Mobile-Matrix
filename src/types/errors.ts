import { z } from 'zod';

// Error codes enum
export const ErrorCodeSchema = z.enum([
  // General errors
  'UNKNOWN_ERROR',
  'VALIDATION_ERROR',
  'NETWORK_ERROR',
  'TIMEOUT_ERROR',
  
  // Authentication errors
  'UNAUTHORIZED',
  'FORBIDDEN',
  'SESSION_EXPIRED',
  
  // Phone-related errors
  'PHONE_NOT_FOUND',
  'BRAND_NOT_FOUND',
  'MODEL_NOT_FOUND',
  'INVALID_PHONE_DATA',
  
  // AI service errors
  'AI_SERVICE_ERROR',
  'AI_RATE_LIMIT_EXCEEDED',
  'AI_CONTEXT_TOO_LARGE',
  'AI_RESPONSE_INVALID',
  
  // Database errors
  'DATABASE_ERROR',
  'DATABASE_CONNECTION_FAILED',
  'DATABASE_QUERY_FAILED',
  
  // Cache errors
  'CACHE_ERROR',
  'CACHE_CONNECTION_FAILED',
  
  // External API errors
  'EXTERNAL_API_ERROR',
  'EXTERNAL_API_RATE_LIMIT',
  'EXTERNAL_API_UNAVAILABLE',
  
  // Comparison errors
  'COMPARISON_FAILED',
  'INSUFFICIENT_DATA',
  'INVALID_COMPARISON_REQUEST',
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

// Application error class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class AppValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
    this.name = 'AppValidationError';
  }
}

export class PhoneNotFoundError extends AppError {
  constructor(brand?: string, model?: string) {
    const message = brand && model 
      ? `Phone not found: ${brand} ${model}`
      : 'Phone not found';
    super(message, 'PHONE_NOT_FOUND', 404, true, { brand, model });
    this.name = 'PhoneNotFoundError';
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'AI_SERVICE_ERROR', 503, true, details);
    this.name = 'AIServiceError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, true, details);
    this.name = 'DatabaseError';
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'EXTERNAL_API_ERROR', 502, true, details);
    this.name = 'ExternalAPIError';
  }
}

export class ComparisonError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'COMPARISON_FAILED', 400, true, details);
    this.name = 'ComparisonError';
  }
}

// Error handler utility type
export type ErrorHandler = (error: Error) => void;

// Error context type for logging
export const ErrorContextSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  path: z.string().optional(),
  method: z.string().optional(),
  timestamp: z.date(),
});

export type ErrorContext = z.infer<typeof ErrorContextSchema>;

// Error log entry type
export const ErrorLogEntrySchema = z.object({
  error: z.object({
    name: z.string(),
    message: z.string(),
    code: ErrorCodeSchema.optional(),
    stack: z.string().optional(),
    statusCode: z.number().optional(),
  }),
  context: ErrorContextSchema,
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  resolved: z.boolean().default(false),
  id: z.string(),
  createdAt: z.date(),
});

export type ErrorLogEntry = z.infer<typeof ErrorLogEntrySchema>;