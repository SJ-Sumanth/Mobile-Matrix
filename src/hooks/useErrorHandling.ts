'use client';

import { useCallback, useState, useEffect } from 'react';
import { useToast } from '@/components/error/ToastProvider';
import { retryWithBackoff, RetryOptions, RetryConfigs } from '@/utils/retry';
import { logError, logCriticalError } from '@/services/errorLogging';
import { AppError, ErrorCode } from '@/types/errors';

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  retryOptions?: RetryOptions;
  context?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  hasError: boolean;
}

/**
 * Comprehensive error handling hook
 */
export function useErrorHandling(options: ErrorHandlingOptions = {}) {
  const { showError, showWarning, showSuccess } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    hasError: false,
  });

  const {
    showToast = true,
    logError: shouldLogError = true,
    retryOptions = RetryConfigs.standard,
    context = 'Unknown',
    severity = 'medium',
  } = options;

  /**
   * Handle an error with all configured options
   */
  const handleError = useCallback(async (
    error: Error | string,
    customOptions?: Partial<ErrorHandlingOptions>
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const opts = { ...options, ...customOptions };

    // Update error state
    setErrorState(prev => ({
      ...prev,
      error: errorObj,
      hasError: true,
    }));

    // Log error if enabled
    if (opts.logError !== false && shouldLogError) {
      const logSeverity = opts.severity || severity;
      if (logSeverity === 'critical') {
        await logCriticalError(errorObj, { context: opts.context || context });
      } else {
        await logError(errorObj, { context: opts.context || context }, logSeverity);
      }
    }

    // Show toast notification if enabled
    if (opts.showToast !== false && showToast) {
      const errorMessage = errorObj.message || 'An unexpected error occurred';
      const errorTitle = `${opts.context || context} Error`;

      if (opts.severity === 'critical') {
        showError(errorTitle, errorMessage, {
          label: 'Report Issue',
          onClick: () => reportError(errorObj, opts.context || context),
        });
      } else if (opts.severity === 'low') {
        showWarning(errorTitle, errorMessage);
      } else {
        showError(errorTitle, errorMessage);
      }
    }
  }, [showError, showWarning, shouldLogError, context, severity, showToast]);

  /**
   * Execute a function with error handling and retry logic
   */
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    customOptions?: Partial<ErrorHandlingOptions>
  ): Promise<T | null> => {
    const opts = { ...options, ...customOptions };
    
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      error: null,
      hasError: false,
    }));

    try {
      const result = await retryWithBackoff(fn, {
        ...retryOptions,
        ...opts.retryOptions,
        onRetry: (attempt, error) => {
          setErrorState(prev => ({
            ...prev,
            retryCount: attempt,
          }));
          
          // Show retry notification
          if (showToast) {
            showWarning(
              'Retrying...',
              `Attempt ${attempt} of ${opts.retryOptions?.maxAttempts || retryOptions.maxAttempts || 3}`
            );
          }
          
          opts.retryOptions?.onRetry?.(attempt, error);
        },
      });

      if (result.success) {
        // Clear error state on success
        setErrorState({
          error: null,
          isRetrying: false,
          retryCount: result.attempts,
          hasError: false,
        });

        // Show success message if there were retries
        if (result.attempts > 1 && showToast) {
          showSuccess('Success', `Operation completed after ${result.attempts} attempts`);
        }

        return result.data!;
      } else {
        // Handle failure after all retries
        await handleError(result.error!, opts);
        return null;
      }
    } catch (error) {
      await handleError(error as Error, opts);
      return null;
    } finally {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }
  }, [handleError, retryOptions, showToast, showWarning, showSuccess]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      hasError: false,
    });
  }, []);

  /**
   * Report error to support/monitoring
   */
  const reportError = useCallback(async (error: Error, context: string) => {
    try {
      await logCriticalError(error, { 
        context,
        reported: true,
        reportedAt: new Date().toISOString(),
      });
      
      showSuccess('Error Reported', 'Thank you for reporting this issue. Our team has been notified.');
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      showError('Report Failed', 'Failed to report the error. Please try again later.');
    }
  }, [showSuccess, showError]);

  return {
    // State
    ...errorState,
    
    // Actions
    handleError,
    executeWithErrorHandling,
    clearError,
    reportError,
  };
}

/**
 * Hook for handling specific error types
 */
export function useServiceErrorHandling(serviceName: string) {
  const baseErrorHandling = useErrorHandling({
    context: serviceName,
    retryOptions: RetryConfigs.standard,
  });

  const handleNetworkError = useCallback((error: Error) => {
    return baseErrorHandling.handleError(error, {
      severity: 'medium',
      retryOptions: RetryConfigs.network,
    });
  }, [baseErrorHandling]);

  const handleRateLimitError = useCallback((error: Error) => {
    return baseErrorHandling.handleError(error, {
      severity: 'low',
      retryOptions: RetryConfigs.rateLimit,
    });
  }, [baseErrorHandling]);

  const handleCriticalError = useCallback((error: Error) => {
    return baseErrorHandling.handleError(error, {
      severity: 'critical',
      retryOptions: { maxAttempts: 1 }, // Don't retry critical errors
    });
  }, [baseErrorHandling]);

  return {
    ...baseErrorHandling,
    handleNetworkError,
    handleRateLimitError,
    handleCriticalError,
  };
}

/**
 * Hook for API call error handling
 */
export function useAPIErrorHandling() {
  return useServiceErrorHandling('API');
}

/**
 * Hook for AI service error handling
 */
export function useAIErrorHandling() {
  return useServiceErrorHandling('AI Service');
}

/**
 * Hook for database error handling
 */
export function useDatabaseErrorHandling() {
  return useServiceErrorHandling('Database');
}