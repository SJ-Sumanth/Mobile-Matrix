import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAPIError } from '../utils/api.js';

/**
 * Request validation middleware
 */
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (validatedData: z.infer<T>) => Promise<NextResponse>
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    try {
      let data: any;
      
      // Parse request data based on method
      if (request.method === 'GET') {
        // Parse query parameters for GET requests
        const url = new URL(request.url);
        const queryParams: Record<string, any> = {};
        
        url.searchParams.forEach((value, key) => {
          // Try to parse numbers and booleans
          if (value === 'true') {
            queryParams[key] = true;
          } else if (value === 'false') {
            queryParams[key] = false;
          } else if (!isNaN(Number(value)) && value !== '') {
            queryParams[key] = Number(value);
          } else {
            queryParams[key] = value;
          }
        });
        
        data = queryParams;
      } else {
        // Parse JSON body for POST, PUT, PATCH requests
        try {
          data = await request.json();
        } catch (error) {
          return NextResponse.json(
            createAPIError(
              'INVALID_JSON',
              'Invalid JSON in request body',
              400
            ),
            { status: 400 }
          );
        }
      }
      
      // Validate data against schema
      const validationResult = schema.safeParse(data);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
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
      
      // Call handler with validated data
      return await handler(validationResult.data);
    } catch (error) {
      console.error('Validation middleware error:', error);
      return NextResponse.json(
        createAPIError(
          'VALIDATION_MIDDLEWARE_ERROR',
          'Internal validation error',
          500
        ),
        { status: 500 }
      );
    }
  };
}

/**
 * Optional validation middleware - validates only if data is present
 */
export function withOptionalValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (validatedData?: z.infer<T>) => Promise<NextResponse>
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    try {
      let data: any = null;
      
      // Parse request data based on method
      if (request.method === 'GET') {
        const url = new URL(request.url);
        if (url.searchParams.size > 0) {
          const queryParams: Record<string, any> = {};
          url.searchParams.forEach((value, key) => {
            queryParams[key] = value;
          });
          data = queryParams;
        }
      } else {
        try {
          const body = await request.text();
          if (body.trim()) {
            data = JSON.parse(body);
          }
        } catch (error) {
          // Ignore JSON parsing errors for optional validation
        }
      }
      
      let validatedData: z.infer<T> | undefined;
      
      if (data) {
        const validationResult = schema.safeParse(data);
        
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(err => ({
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
        
        validatedData = validationResult.data;
      }
      
      // Call handler with validated data (or undefined)
      return await handler(validatedData);
    } catch (error) {
      console.error('Optional validation middleware error:', error);
      return NextResponse.json(
        createAPIError(
          'VALIDATION_MIDDLEWARE_ERROR',
          'Internal validation error',
          500
        ),
        { status: 500 }
      );
    }
  };
}

/**
 * Path parameter validation middleware
 */
export function withPathValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (validatedParams: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return function (
    request: NextRequest,
    context: { params: Record<string, string> }
  ) {
    return async function (): Promise<NextResponse> {
      try {
        const validationResult = schema.safeParse(context.params);
        
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.input,
            code: err.code,
          }));
          
          return NextResponse.json(
            createAPIError(
              'PATH_VALIDATION_ERROR',
              'Path parameter validation failed',
              400,
              { errors }
            ),
            { status: 400 }
          );
        }
        
        return await handler(validationResult.data, request);
      } catch (error) {
        console.error('Path validation middleware error:', error);
        return NextResponse.json(
          createAPIError(
            'PATH_VALIDATION_MIDDLEWARE_ERROR',
            'Internal path validation error',
            500
          ),
          { status: 500 }
        );
      }
    };
  };
}