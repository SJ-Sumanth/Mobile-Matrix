'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorCode } from '@/types/errors';
import { logError } from '@/middleware/errorHandler';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    logError(error, {
      errorInfo,
      component: 'ErrorBoundary',
      level: this.props.level || 'component',
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error level
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  private renderDefaultFallback() {
    const { error } = this.state;
    const { level = 'component' } = this.props;
    const canRetry = this.retryCount < this.maxRetries;

    // Critical level errors - full page fallback
    if (level === 'critical') {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-gray-900 border-gray-700">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">💥</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Critical Error
              </h1>
              <p className="text-gray-300 mb-6">
                Something went seriously wrong. Please reload the page or contact support if the problem persists.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={this.handleReload}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Reload Page
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Go to Homepage
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-400 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-400 bg-gray-800 p-2 rounded overflow-auto">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    // Page level errors
    if (level === 'page') {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-gray-900 border-gray-700">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">😵</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Page Error
              </h2>
              <p className="text-gray-300 mb-4">
                This page encountered an error. You can try refreshing or go back to continue browsing.
              </p>
              <div className="flex gap-3 justify-center">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Component level errors - minimal fallback
    return (
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-medium text-white">Component Error</h3>
            <p className="text-sm text-gray-400">
              This component failed to load properly.
            </p>
          </div>
          {canRetry && (
            <Button 
              onClick={this.handleRetry}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical">
    {children}
  </ErrorBoundary>
);