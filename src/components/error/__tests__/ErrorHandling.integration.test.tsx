import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../ToastProvider';
import { ErrorBoundary } from '../ErrorBoundary';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { AIServiceFallback, PhoneDataFallback } from '../FallbackComponents';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock the error logging service
vi.mock('@/services/errorLogging', () => ({
  logError: vi.fn(),
  logCriticalError: vi.fn(),
}));

// Mock the retry utility
vi.mock('@/utils/retry', () => ({
  retryWithBackoff: vi.fn(),
  RetryConfigs: {
    standard: { maxAttempts: 3, baseDelay: 1000 },
  },
}));

const { retryWithBackoff } = await import('@/utils/retry');

// Test component that simulates AI service errors
const AIServiceComponent: React.FC = () => {
  const { executeWithErrorHandling, isRetrying, hasError } = useErrorHandling({
    context: 'AI Service',
    severity: 'medium',
  });

  const handleAIRequest = async () => {
    const result = await executeWithErrorHandling(async () => {
      throw new Error('AI service temporarily unavailable');
    });
    
    if (result) {
      console.log('AI request successful:', result);
    }
  };

  if (hasError) {
    return <AIServiceFallback onRetry={handleAIRequest} />;
  }

  return (
    <div>
      <button onClick={handleAIRequest} disabled={isRetrying}>
        {isRetrying ? 'Processing...' : 'Ask AI'}
      </button>
    </div>
  );
};

// Test component that simulates phone data errors
const PhoneDataComponent: React.FC = () => {
  const { executeWithErrorHandling, hasError } = useErrorHandling({
    context: 'Phone Data',
    severity: 'high',
  });

  const loadPhoneData = async () => {
    await executeWithErrorHandling(async () => {
      throw new Error('Failed to load phone data');
    });
  };

  if (hasError) {
    return <PhoneDataFallback onRetry={loadPhoneData} />;
  }

  return (
    <div>
      <button onClick={loadPhoneData}>Load Phone Data</button>
    </div>
  );
};

// Component that throws an error to test error boundary
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Component crashed');
  }
  return <div>Component working</div>;
};

// Main test component
const TestApp: React.FC<{ throwError?: boolean }> = ({ throwError = false }) => {
  return (
    <ToastProvider>
      <ErrorBoundary level="page">
        <div>
          <h1>Error Handling Integration Test</h1>
          <AIServiceComponent />
          <PhoneDataComponent />
          <ErrorThrowingComponent shouldThrow={throwError} />
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
};

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles AI service errors with fallback UI', async () => {
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: false,
      error: new Error('AI service temporarily unavailable'),
      attempts: 3,
      totalTime: 300,
    });

    render(<TestApp />);

    // Click AI button to trigger error
    fireEvent.click(screen.getByText('Ask AI'));

    // Should show AI service fallback
    await waitFor(() => {
      expect(screen.getByText('AI Assistant Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Our AI assistant is temporarily unavailable/)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText(/Try Again/)).toBeInTheDocument();
  });

  it('handles phone data errors with fallback UI', async () => {
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: false,
      error: new Error('Failed to load phone data'),
      attempts: 3,
      totalTime: 300,
    });

    render(<TestApp />);

    // Click phone data button to trigger error
    fireEvent.click(screen.getByText('Load Phone Data'));

    // Should show phone data fallback
    await waitFor(() => {
      expect(screen.getByText('Phone Data Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/We're having trouble loading phone information/)).toBeInTheDocument();
    });
  });

  it('handles component crashes with error boundary', () => {
    render(<TestApp throwError={true} />);

    // Should show error boundary fallback
    expect(screen.getByText('Page Error')).toBeInTheDocument();
    expect(screen.getByText(/This page encountered an error/)).toBeInTheDocument();
  });

  it('shows toast notifications for errors', async () => {
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: false,
      error: new Error('Service error'),
      attempts: 1,
      totalTime: 100,
    });

    render(<TestApp />);

    // Trigger AI service error
    fireEvent.click(screen.getByText('Ask AI'));

    // Should show error toast
    await waitFor(() => {
      expect(screen.getByText('AI Service Error')).toBeInTheDocument();
    });
  });

  it('handles successful retry after initial failure', async () => {
    // First call fails, second succeeds
    vi.mocked(retryWithBackoff)
      .mockResolvedValueOnce({
        success: false,
        error: new Error('Temporary failure'),
        attempts: 3,
        totalTime: 300,
      })
      .mockResolvedValueOnce({
        success: true,
        data: 'Success after retry',
        attempts: 2,
        totalTime: 200,
      });

    render(<TestApp />);

    // First attempt - should show fallback
    fireEvent.click(screen.getByText('Ask AI'));

    await waitFor(() => {
      expect(screen.getByText('AI Assistant Unavailable')).toBeInTheDocument();
    });

    // Retry - should succeed and show success toast
    fireEvent.click(screen.getByText(/Try Again/));

    await waitFor(() => {
      expect(screen.getByText('Ask AI')).toBeInTheDocument(); // Back to normal state
    });
  });

  it('handles multiple simultaneous errors', async () => {
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: false,
      error: new Error('Service unavailable'),
      attempts: 3,
      totalTime: 300,
    });

    render(<TestApp />);

    // Trigger multiple errors simultaneously
    fireEvent.click(screen.getByText('Ask AI'));
    fireEvent.click(screen.getByText('Load Phone Data'));

    // Should show both fallback UIs
    await waitFor(() => {
      expect(screen.getByText('AI Assistant Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Phone Data Unavailable')).toBeInTheDocument();
    });
  });

  it('provides recovery options in fallback UIs', async () => {
    vi.mocked(retryWithBackoff).mockResolvedValue({
      success: false,
      error: new Error('Network error'),
      attempts: 3,
      totalTime: 300,
    });

    render(<TestApp />);

    fireEvent.click(screen.getByText('Ask AI'));

    await waitFor(() => {
      expect(screen.getByText('AI Assistant Unavailable')).toBeInTheDocument();
    });

    // Should have retry and alternative action buttons
    expect(screen.getByText(/Try Again/)).toBeInTheDocument();
    expect(screen.getByText('Browse Phones')).toBeInTheDocument();
  });

  it('handles error boundary retry functionality', () => {
    const { rerender } = render(<TestApp throwError={true} />);

    // Should show error boundary
    expect(screen.getByText('Page Error')).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByText(/Try Again/));

    // Component should attempt to render again
    expect(screen.getByText('Page Error')).toBeInTheDocument(); // Still fails
  });

  it('limits retry attempts in error boundary', () => {
    render(<TestApp throwError={true} />);

    // Should show retry button initially
    expect(screen.getByText(/Try Again \(3 left\)/)).toBeInTheDocument();

    // Click retry multiple times
    fireEvent.click(screen.getByText(/Try Again/));
    fireEvent.click(screen.getByText(/Try Again/));
    fireEvent.click(screen.getByText(/Try Again/));

    // After max retries, should not show retry button
    expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
  });
});