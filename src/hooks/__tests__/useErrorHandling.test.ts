import { renderHook, act } from '@testing-library/react';
import { useErrorHandling, useServiceErrorHandling } from '../useErrorHandling';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock the dependencies
vi.mock('@/components/error/ToastProvider', () => ({
  useToast: () => ({
    showError: vi.fn(),
    showWarning: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

vi.mock('@/services/errorLogging', () => ({
  logError: vi.fn(),
  logCriticalError: vi.fn(),
}));

vi.mock('@/utils/retry', () => ({
  retryWithBackoff: vi.fn(),
  RetryConfigs: {
    standard: { maxAttempts: 3, baseDelay: 1000 },
    network: { maxAttempts: 3, baseDelay: 2000 },
    rateLimit: { maxAttempts: 4, baseDelay: 5000 },
  },
}));

const { retryWithBackoff } = await import('@/utils/retry');
const { logError, logCriticalError } = await import('@/services/errorLogging');

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useErrorHandling());

    expect(result.current.error).toBeNull();
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.hasError).toBe(false);
  });

  it('handles errors correctly', async () => {
    const { result } = renderHook(() => useErrorHandling());

    await act(async () => {
      await result.current.handleError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toBe('Test error');
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'Unknown' }),
      'medium'
    );
  });

  it('handles critical errors', async () => {
    const { result } = renderHook(() => useErrorHandling());

    await act(async () => {
      await result.current.handleError(new Error('Critical error'), { severity: 'critical' });
    });

    expect(logCriticalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'Unknown' })
    );
  });

  it('executes function with error handling', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: true,
      data: 'success',
      attempts: 1,
      totalTime: 100,
    });

    const { result } = renderHook(() => useErrorHandling());

    let returnValue;
    await act(async () => {
      returnValue = await result.current.executeWithErrorHandling(mockFn);
    });

    expect(returnValue).toBe('success');
    expect(result.current.hasError).toBe(false);
    expect(mockFn).toHaveBeenCalled();
  });

  it('handles function execution failure', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Function failed'));
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: false,
      error: new Error('Function failed'),
      attempts: 3,
      totalTime: 300,
    });

    const { result } = renderHook(() => useErrorHandling());

    let returnValue;
    await act(async () => {
      returnValue = await result.current.executeWithErrorHandling(mockFn);
    });

    expect(returnValue).toBeNull();
    expect(result.current.hasError).toBe(true);
  });

  it('clears error state', () => {
    const { result } = renderHook(() => useErrorHandling());

    // Set error state
    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reports errors', async () => {
    const { result } = renderHook(() => useErrorHandling());

    await act(async () => {
      await result.current.reportError(new Error('Reported error'), 'Test Context');
    });

    expect(logCriticalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'Test Context',
        reported: true,
      })
    );
  });

  it('uses custom options', () => {
    const customOptions = {
      context: 'Custom Context',
      severity: 'high' as const,
      showToast: false,
    };

    const { result } = renderHook(() => useErrorHandling(customOptions));

    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'Custom Context' }),
      'high'
    );
  });
});

describe('useServiceErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates service-specific error handler', () => {
    const { result } = renderHook(() => useServiceErrorHandling('TestService'));

    expect(typeof result.current.handleNetworkError).toBe('function');
    expect(typeof result.current.handleRateLimitError).toBe('function');
    expect(typeof result.current.handleCriticalError).toBe('function');
  });

  it('handles network errors with appropriate config', async () => {
    const { result } = renderHook(() => useServiceErrorHandling('TestService'));

    await act(async () => {
      await result.current.handleNetworkError(new Error('Network error'));
    });

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'TestService' }),
      'medium'
    );
  });

  it('handles rate limit errors with appropriate config', async () => {
    const { result } = renderHook(() => useServiceErrorHandling('TestService'));

    await act(async () => {
      await result.current.handleRateLimitError(new Error('Rate limit exceeded'));
    });

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'TestService' }),
      'low'
    );
  });

  it('handles critical errors without retry', async () => {
    const { result } = renderHook(() => useServiceErrorHandling('TestService'));

    await act(async () => {
      await result.current.handleCriticalError(new Error('Critical system failure'));
    });

    expect(logCriticalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'TestService' })
    );
  });
});