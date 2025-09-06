import { z } from 'zod';
import { ValidationResult, ValidationError } from '../types/api';

/**
 * Validate data against a Zod schema and return a structured result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: [],
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.code === 'invalid_type' ? undefined : data,
        code: err.code,
      }));

      return {
        isValid: false,
        errors: validationErrors,
        data: undefined,
      };
    }

    // Handle unexpected errors
    return {
      isValid: false,
      errors: [
        {
          field: 'unknown',
          message: 'An unexpected validation error occurred',
          code: 'unknown_error',
        },
      ],
      data: undefined,
    };
  }
}

/**
 * Safely parse data with a Zod schema, returning null on failure
 */
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate phone search query
 */
export function validatePhoneSearchQuery(query: string): boolean {
  return query.trim().length >= 2 && query.trim().length <= 100;
}

/**
 * Validate brand name
 */
export function validateBrandName(brand: string): boolean {
  const brandRegex = /^[a-zA-Z0-9\s\-&.]+$/;
  return brandRegex.test(brand) && brand.length >= 2 && brand.length <= 50;
}

/**
 * Validate phone model name
 */
export function validatePhoneModel(model: string): boolean {
  const modelRegex = /^[a-zA-Z0-9\s\-+.()]+$/;
  return modelRegex.test(model) && model.length >= 1 && model.length <= 100;
}

/**
 * Validate price value
 */
export function validatePrice(price: number): boolean {
  return price > 0 && price <= 1000000 && Number.isFinite(price);
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): boolean {
  const sessionIdRegex = /^[a-zA-Z0-9\-_]{20,50}$/;
  return sessionIdRegex.test(sessionId);
}

/**
 * Sanitize user input for search queries
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially harmful characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
}

/**
 * Sanitize brand name input
 */
export function sanitizeBrandName(brand: string): string {
  return brand
    .trim()
    .replace(/[^a-zA-Z0-9\s\-&.]/g, '') // Keep only allowed characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 50); // Limit length
}

/**
 * Sanitize phone model input
 */
export function sanitizePhoneModel(model: string): string {
  return model
    .trim()
    .replace(/[^a-zA-Z0-9\s\-+.()]/g, '') // Keep only allowed characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
}

/**
 * Create validation error
 */
export function createValidationError(
  field: string,
  message: string,
  value?: any,
  code?: string
): ValidationError {
  return {
    field,
    message,
    value,
    code,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
  results: ValidationResult[]
): ValidationResult {
  const allErrors = results.flatMap((result) => result.errors);
  const isValid = allErrors.length === 0;

  return {
    isValid,
    errors: allErrors,
    data: isValid ? results.map((r) => r.data) : undefined,
  };
}