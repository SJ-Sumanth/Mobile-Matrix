/**
 * Retry mechanism with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
    retryCondition = () => true,
    onRetry,
  } = options;

  const startTime = Date.now();
  let lastError: Error;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (!retryCondition(lastError)) {
        break;
      }
      
      // Don't wait after the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Call retry callback
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor, jitter);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError!,
    attempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitter: boolean
): number {
  // Calculate exponential backoff
  let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  
  // Apply maximum delay limit
  delay = Math.min(delay, maxDelay);
  
  // Add jitter to prevent thundering herd
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Predefined retry conditions for common scenarios
 */
export const RetryConditions = {
  // Retry on network errors
  networkErrors: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('fetch')
    );
  },

  // Retry on server errors (5xx status codes)
  serverErrors: (error: Error): boolean => {
    if ('status' in error) {
      const status = (error as any).status;
      return status >= 500 && status < 600;
    }
    return false;
  },

  // Retry on rate limit errors
  rateLimitErrors: (error: Error): boolean => {
    if ('status' in error) {
      const status = (error as any).status;
      return status === 429;
    }
    return error.message.toLowerCase().includes('rate limit');
  },

  // Retry on temporary errors (network + server + rate limit)
  temporaryErrors: (error: Error): boolean => {
    return (
      RetryConditions.networkErrors(error) ||
      RetryConditions.serverErrors(error) ||
      RetryConditions.rateLimitErrors(error)
    );
  },

  // Never retry (for testing or specific use cases)
  never: (): boolean => false,

  // Always retry (be careful with this)
  always: (): boolean => true,
};

/**
 * Predefined retry configurations for common scenarios
 */
export const RetryConfigs = {
  // Quick retry for UI interactions
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: RetryConditions.temporaryErrors,
  },

  // Standard retry for API calls
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: RetryConditions.temporaryErrors,
  },

  // Aggressive retry for critical operations
  aggressive: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: RetryConditions.temporaryErrors,
  },

  // Network-specific retry
  network: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: RetryConditions.networkErrors,
  },

  // Rate limit specific retry
  rateLimit: {
    maxAttempts: 4,
    baseDelay: 5000,
    maxDelay: 60000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: RetryConditions.rateLimitErrors,
  },
};

/**
 * React hook for retry functionality
 */
import { useState, useCallback } from 'react';

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const retry = useCallback(async (): Promise<RetryResult<T>> => {
    setIsRetrying(true);
    setLastError(null);

    const result = await retryWithBackoff(fn, {
      ...options,
      onRetry: (attempt, error) => {
        setRetryCount(attempt);
        options.onRetry?.(attempt, error);
      },
    });

    setIsRetrying(false);
    setRetryCount(result.attempts);
    
    if (!result.success) {
      setLastError(result.error!);
    }

    return result;
  }, [fn, options]);

  return {
    retry,
    isRetrying,
    retryCount,
    lastError,
  };
}

/**
 * Wrapper for fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const result = await retryWithBackoff(
    () => fetch(url, options),
    {
      ...RetryConfigs.standard,
      ...retryOptions,
      retryCondition: (error) => {
        // Check if it's a network error or server error
        if (RetryConditions.networkErrors(error)) {
          return true;
        }
        
        // For fetch errors, we need to check the response status
        if ('status' in error) {
          const status = (error as any).status;
          return status >= 500 || status === 429;
        }
        
        return false;
      },
    }
  );

  if (!result.success) {
    throw result.error;
  }

  return result.data!;
}