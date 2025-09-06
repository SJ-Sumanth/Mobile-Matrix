import { retryWithBackoff, RetryConditions, RetryConfigs, fetchWithRetry } from '../retry';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock fetch for testing
global.fetch = vi.fn();

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(mockFn);

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(mockFn, { maxAttempts: 3 });

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(2);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('fails after max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));

    const result = await retryWithBackoff(mockFn, { maxAttempts: 2, baseDelay: 10 });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Persistent failure');
    expect(result.attempts).toBe(2);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('respects retry condition', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Non-retryable error'));
    const retryCondition = vi.fn().mockReturnValue(false);

    const result = await retryWithBackoff(mockFn, { 
      maxAttempts: 3, 
      retryCondition,
      baseDelay: 10 
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls onRetry callback', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    const onRetry = vi.fn();

    await retryWithBackoff(mockFn, { 
      maxAttempts: 3, 
      onRetry,
      baseDelay: 10 
    });

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('applies exponential backoff', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));
    const startTime = Date.now();

    await retryWithBackoff(mockFn, { 
      maxAttempts: 3, 
      baseDelay: 100,
      backoffFactor: 2,
      jitter: false // Disable jitter for predictable timing
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should have waited at least 100ms + 200ms = 300ms
    // (allowing some tolerance for test execution time)
    expect(totalTime).toBeGreaterThan(250);
  });
});

describe('RetryConditions', () => {
  it('identifies network errors', () => {
    expect(RetryConditions.networkErrors(new Error('Network error'))).toBe(true);
    expect(RetryConditions.networkErrors(new Error('ECONNREFUSED'))).toBe(true);
    expect(RetryConditions.networkErrors(new Error('timeout'))).toBe(true);
    expect(RetryConditions.networkErrors(new Error('fetch failed'))).toBe(true);
    expect(RetryConditions.networkErrors(new Error('Invalid input'))).toBe(false);
  });

  it('identifies server errors', () => {
    const serverError = new Error('Server error') as any;
    serverError.status = 500;
    
    const clientError = new Error('Client error') as any;
    clientError.status = 400;

    expect(RetryConditions.serverErrors(serverError)).toBe(true);
    expect(RetryConditions.serverErrors(clientError)).toBe(false);
  });

  it('identifies rate limit errors', () => {
    const rateLimitError = new Error('Rate limit') as any;
    rateLimitError.status = 429;
    
    const normalError = new Error('Rate limit exceeded');

    expect(RetryConditions.rateLimitErrors(rateLimitError)).toBe(true);
    expect(RetryConditions.rateLimitErrors(normalError)).toBe(true);
    expect(RetryConditions.rateLimitErrors(new Error('Other error'))).toBe(false);
  });

  it('identifies temporary errors', () => {
    const networkError = new Error('Network timeout');
    const serverError = new Error('Server error') as any;
    serverError.status = 503;
    const rateLimitError = new Error('Rate limit exceeded');
    const permanentError = new Error('Invalid credentials');

    expect(RetryConditions.temporaryErrors(networkError)).toBe(true);
    expect(RetryConditions.temporaryErrors(serverError)).toBe(true);
    expect(RetryConditions.temporaryErrors(rateLimitError)).toBe(true);
    expect(RetryConditions.temporaryErrors(permanentError)).toBe(false);
  });
});

describe('RetryConfigs', () => {
  it('has predefined configurations', () => {
    expect(RetryConfigs.quick.maxAttempts).toBe(2);
    expect(RetryConfigs.standard.maxAttempts).toBe(3);
    expect(RetryConfigs.aggressive.maxAttempts).toBe(5);
    expect(RetryConfigs.network.retryCondition).toBe(RetryConditions.networkErrors);
    expect(RetryConfigs.rateLimit.retryCondition).toBe(RetryConditions.rateLimitErrors);
  });
});

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  it('succeeds on first attempt', async () => {
    const mockResponse = new Response('success', { status: 200 });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://api.example.com/data');

    expect(result).toBe(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network failure', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(new Response('success', { status: 200 }));

    const result = await fetchWithRetry('https://api.example.com/data', {}, { baseDelay: 10 });

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('passes through fetch options', async () => {
    const mockResponse = new Response('success', { status: 200 });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
    };

    await fetchWithRetry('https://api.example.com/data', options);

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', options);
  });

  it('throws error after max retries', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Persistent network error'));

    await expect(
      fetchWithRetry('https://api.example.com/data', {}, { 
        maxAttempts: 2, 
        baseDelay: 10 
      })
    ).rejects.toThrow('Persistent network error');

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});