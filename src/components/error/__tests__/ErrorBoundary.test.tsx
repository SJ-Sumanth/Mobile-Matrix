import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';

// Mock the error logging
vi.mock('@/middleware/errorHandler', () => ({
  logError: vi.fn(),
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();
    expect(screen.getByText('This component failed to load properly.')).toBeInTheDocument();
  });

  it('renders page-level error UI', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Page Error')).toBeInTheDocument();
    expect(screen.getByText(/This page encountered an error/)).toBeInTheDocument();
  });

  it('renders critical error UI', () => {
    render(
      <ErrorBoundary level="critical">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Critical Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went seriously wrong/)).toBeInTheDocument();
  });

  it('allows retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Component Error')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText(/Retry/);
    fireEvent.click(retryButton);

    // Component should try to render again (and fail again in this case)
    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('limits retry attempts', () => {
    render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    );

    // Should show retry button initially
    expect(screen.getByText(/Retry/)).toBeInTheDocument();

    // Click retry multiple times
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByText(/Retry/);
      fireEvent.click(retryButton);
    }

    // After max retries, button should not be available
    expect(screen.queryByText(/Retry/)).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, { level: 'component' });

    render(<WrappedComponent />);

    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });

  it('passes props to wrapped component', () => {
    const TestComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>{message}</div>
    );

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Test message" />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});