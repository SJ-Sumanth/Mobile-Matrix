import { z } from 'zod';

// API response status enum
export const APIStatusSchema = z.enum(['success', 'error', 'loading']);
export type APIStatus = z.infer<typeof APIStatusSchema>;

// Error severity enum
export const ErrorSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;

// API error schema and type
export const APIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  severity: ErrorSeveritySchema.default('medium'),
  timestamp: z.date(),
  requestId: z.string().optional(),
  path: z.string().optional(),
});

export type APIError = z.infer<typeof APIErrorSchema>;

// Success API response schema and type
export const APISuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.date(),
    requestId: z.string().optional(),
  });

export type APISuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
  requestId?: string;
};

// Error API response schema and type
export const APIErrorResponseSchema = z.object({
  success: z.literal(false),
  error: APIErrorSchema,
});

export type APIErrorResponse = z.infer<typeof APIErrorResponseSchema>;

// Generic API response type
export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

// Pagination metadata schema and type
export const PaginationMetaSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

// Paginated response schema and type
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

// Search query schema and type
export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  filters: z.record(z.string(), z.any()).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// HTTP method enum
export const HTTPMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
export type HTTPMethod = z.infer<typeof HTTPMethodSchema>;

// Request options schema and type
export const RequestOptionsSchema = z.object({
  method: HTTPMethodSchema.default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(5).default(3),
  retryDelay: z.number().positive().default(1000),
});

export type RequestOptions = z.infer<typeof RequestOptionsSchema>;

// Validation error schema and type
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.any().optional(),
  code: z.string().optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Validation result schema and type
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  data: z.any().optional(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Rate limit info schema and type
export const RateLimitInfoSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.date(),
  retryAfter: z.number().optional(),
});

export type RateLimitInfo = z.infer<typeof RateLimitInfoSchema>;

// Health check status schema and type
export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// Health check result schema and type
export const HealthCheckResultSchema = z.object({
  status: HealthStatusSchema,
  timestamp: z.date(),
  services: z.record(z.string(), z.object({
    status: HealthStatusSchema,
    responseTime: z.number().optional(),
    error: z.string().optional(),
  })),
  uptime: z.number(),
  version: z.string(),
});

export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;
