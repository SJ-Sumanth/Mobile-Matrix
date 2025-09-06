import { NextRequest, NextResponse } from 'next/server';
import { createAPIError } from '../utils/api.js';
import { z } from 'zod';

/**
 * Error types that can be thrown in the application
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT_EXCEEDED', message, 429);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super('SERVICE_UNAVAILABLE', `${service} service is currently unavailable`, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Global error handling middleware
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      // Handle different types of errors
      if (error instanceof AppError) {
        return NextResponse.json(
          createAPIError(error.code, error.message, error.statusCode, error.details),
          { status: error.statusCode }
        );
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code,
        }));

        return NextResponse.json(
          createAPIError(
            'VALIDATION_ERROR',
            'Request validation failed',
            400,
            { errors }
          ),
          { status: 400 }
        );
      }

      // Handle database connection errors
      if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json(
          createAPIError(
            'DATABASE_ERROR',
            'Database connection error',
            503
          ),
          { status: 503 }
        );
      }

      // Handle timeout errors
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('ETIMEDOUT')
      )) {
        return NextResponse.json(
          createAPIError(
            'TIMEOUT_ERROR',
            'Request timeout',
            408
          ),
          { status: 408 }
        );
      }

      // Handle network errors
      if (error instanceof Error && (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('network')
      )) {
        return NextResponse.json(
          createAPIError(
            'NETWORK_ERROR',
            'Network connection error',
            503
          ),
          { status: 503 }
        );
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json(
          createAPIError(
            'INVALID_JSON',
            'Invalid JSON in request body',
            400
          ),
          { status: 400 }
        );
      }

      // Generic error fallback
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return NextResponse.json(
        createAPIError(
          'INTERNAL_SERVER_ERROR',
          isDevelopment 
            ? (error instanceof Error ? error.message : String(error))
            : 'An unexpected error occurred',
          500,
          isDevelopment ? { 
            stack: error instanceof Error ? error.stack : undefined 
          } : undefined
        ),
        { status: 500 }
      );
    }
  };
}

/**
 * Async error wrapper for better error handling
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw error;
    });
  };
}

/**
 * Error logging utility
 */
export function logError(error: Error, context?: Record<string, any>) {
  const errorLog = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, you might want to send this to a logging service
  console.error('Application Error:', errorLog);

  // You can extend this to send to external logging services like:
  // - Sentry
  // - LogRocket
  // - DataDog
  // - CloudWatch
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
) {
  return NextResponse.json(
    createAPIError(code, message, statusCode, details),
    { status: statusCode }
  );
}