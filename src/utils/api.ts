import { NextResponse } from 'next/server';
import { 
  APISuccessResponse, 
  APIErrorResponse, 
  APIError,
  PaginatedResponse,
  PaginationMeta 
} from '../types/api.js';

/**
 * Create a standardized API success response
 */
export function createAPIResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): APISuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date(),
    requestId,
  };
}

/**
 * Create a standardized API error response
 */
export function createAPIError(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any,
  requestId?: string
): APIErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      severity: getSeverityFromStatusCode(statusCode),
      timestamp: new Date(),
      requestId,
    },
  };
}

/**
 * Create a paginated API response
 */
export function createPaginatedResponse<T>(
  items: T[],
  meta: PaginationMeta,
  message?: string,
  requestId?: string
): APISuccessResponse<PaginatedResponse<T>> {
  return createAPIResponse(
    { items, meta },
    message,
    requestId
  );
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get error severity based on HTTP status code
 */
function getSeverityFromStatusCode(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'high';
  if (statusCode >= 300) return 'medium';
  return 'low';
}

/**
 * Create a NextResponse with proper JSON and status
 */
export function createJSONResponse<T>(
  data: APISuccessResponse<T> | APIErrorResponse,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add custom headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

/**
 * Handle async API operations with proper error handling
 */
export async function handleAPIOperation<T>(
  operation: () => Promise<T>,
  successMessage?: string,
  requestId?: string
): Promise<NextResponse> {
  try {
    const result = await operation();
    
    return createJSONResponse(
      createAPIResponse(result, successMessage, requestId)
    );
  } catch (error) {
    console.error('API operation failed:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      const statusCode = getStatusCodeFromError(error);
      
      return createJSONResponse(
        createAPIError(
          getErrorCodeFromError(error),
          error.message,
          statusCode,
          undefined,
          requestId
        ),
        statusCode
      );
    }
    
    // Fallback for unknown errors
    return createJSONResponse(
      createAPIError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred',
        500,
        undefined,
        requestId
      ),
      500
    );
  }
}

/**
 * Get HTTP status code from error type
 */
function getStatusCodeFromError(error: Error): number {
  const message = error.message.toLowerCase();
  
  if (message.includes('not found')) return 404;
  if (message.includes('unauthorized')) return 401;
  if (message.includes('forbidden')) return 403;
  if (message.includes('validation')) return 400;
  if (message.includes('rate limit')) return 429;
  if (message.includes('timeout')) return 408;
  if (message.includes('service unavailable')) return 503;
  
  return 500;
}

/**
 * Get error code from error type
 */
function getErrorCodeFromError(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('not found')) return 'NOT_FOUND';
  if (message.includes('unauthorized')) return 'UNAUTHORIZED';
  if (message.includes('forbidden')) return 'FORBIDDEN';
  if (message.includes('validation')) return 'VALIDATION_ERROR';
  if (message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
  if (message.includes('timeout')) return 'TIMEOUT_ERROR';
  if (message.includes('service unavailable')) return 'SERVICE_UNAVAILABLE';
  
  return 'INTERNAL_SERVER_ERROR';
}

/**
 * Validate and parse query parameters
 */
export function parseQueryParams(
  searchParams: URLSearchParams,
  defaults: Record<string, any> = {}
): Record<string, any> {
  const params: Record<string, any> = { ...defaults };
  
  searchParams.forEach((value, key) => {
    // Try to parse different types
    if (value === 'true') {
      params[key] = true;
    } else if (value === 'false') {
      params[key] = false;
    } else if (value === 'null') {
      params[key] = null;
    } else if (value === 'undefined') {
      params[key] = undefined;
    } else if (!isNaN(Number(value)) && value !== '') {
      params[key] = Number(value);
    } else {
      params[key] = value;
    }
  });
  
  return params;
}

/**
 * Extract request metadata for logging and debugging
 */
export function extractRequestMetadata(request: Request): Record<string, any> {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    authorization: request.headers.get('authorization') ? '[REDACTED]' : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sanitize sensitive data from objects
 */
export function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Redact sensitive fields
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth')
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}