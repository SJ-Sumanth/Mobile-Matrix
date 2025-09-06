'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

interface FallbackProps {
  onRetry?: () => void;
  onGoHome?: () => void;
  canRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

// AI Service Fallback
export const AIServiceFallback: React.FC<FallbackProps> = ({
  onRetry,
  canRetry = true,
  retryCount = 0,
  maxRetries = 3,
}) => (
  <Card className="p-6 bg-gray-900 border-gray-700">
    <div className="text-center">
      <div className="text-4xl mb-4">🤖</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        AI Assistant Unavailable
      </h3>
      <p className="text-gray-300 mb-4">
        Our AI assistant is temporarily unavailable. You can still browse and compare phones manually.
      </p>
      <div className="flex gap-3 justify-center">
        {canRetry && onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-primary hover:bg-primary/90"
          >
            Try Again ({maxRetries - retryCount} left)
          </Button>
        )}
        <Button 
          onClick={() => window.location.href = '/comparison'}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Browse Phones
        </Button>
      </div>
    </div>
  </Card>
);

// Phone Data Service Fallback
export const PhoneDataFallback: React.FC<FallbackProps> = ({
  onRetry,
  canRetry = true,
  retryCount = 0,
  maxRetries = 3,
}) => (
  <Card className="p-6 bg-gray-900 border-gray-700">
    <div className="text-center">
      <div className="text-4xl mb-4">📱</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Phone Data Unavailable
      </h3>
      <p className="text-gray-300 mb-4">
        We're having trouble loading phone information. This might be a temporary issue.
      </p>
      <div className="flex gap-3 justify-center">
        {canRetry && onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-primary hover:bg-primary/90"
          >
            Retry ({maxRetries - retryCount} left)
          </Button>
        )}
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  </Card>
);

// Comparison Service Fallback
export const ComparisonFallback: React.FC<FallbackProps> = ({
  onRetry,
  onGoHome,
  canRetry = true,
  retryCount = 0,
  maxRetries = 3,
}) => (
  <Card className="p-6 bg-gray-900 border-gray-700">
    <div className="text-center">
      <div className="text-4xl mb-4">⚖️</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Comparison Unavailable
      </h3>
      <p className="text-gray-300 mb-4">
        We couldn't generate the phone comparison. This might be due to missing data or a temporary service issue.
      </p>
      <div className="flex gap-3 justify-center">
        {canRetry && onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-primary hover:bg-primary/90"
          >
            Try Again ({maxRetries - retryCount} left)
          </Button>
        )}
        <Button 
          onClick={onGoHome || (() => window.location.href = '/')}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Start Over
        </Button>
      </div>
    </div>
  </Card>
);

// Network Error Fallback
export const NetworkErrorFallback: React.FC<FallbackProps> = ({
  onRetry,
  canRetry = true,
}) => (
  <Card className="p-6 bg-gray-900 border-gray-700">
    <div className="text-center">
      <div className="text-4xl mb-4">🌐</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Connection Problem
      </h3>
      <p className="text-gray-300 mb-4">
        Please check your internet connection and try again.
      </p>
      <div className="flex gap-3 justify-center">
        {canRetry && onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-primary hover:bg-primary/90"
          >
            Try Again
          </Button>
        )}
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  </Card>
);

// Loading Fallback with Error State
interface LoadingFallbackProps {
  message?: string;
  hasError?: boolean;
  onRetry?: () => void;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
  hasError = false,
  onRetry,
}) => {
  if (hasError) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Loading Failed
          </h3>
          <p className="text-gray-300 mb-4">
            Something went wrong while loading the content.
          </p>
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="bg-primary hover:bg-primary/90"
            >
              Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-700">
      <div className="text-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-300">{message}</p>
      </div>
    </Card>
  );
};

// Generic Error Fallback
interface GenericErrorFallbackProps extends FallbackProps {
  title?: string;
  message?: string;
  icon?: string;
}

export const GenericErrorFallback: React.FC<GenericErrorFallbackProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  icon = '😵',
  onRetry,
  onGoHome,
  canRetry = true,
  retryCount = 0,
  maxRetries = 3,
}) => (
  <Card className="p-6 bg-gray-900 border-gray-700">
    <div className="text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-300 mb-4">
        {message}
      </p>
      <div className="flex gap-3 justify-center">
        {canRetry && onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-primary hover:bg-primary/90"
          >
            Try Again ({maxRetries - retryCount} left)
          </Button>
        )}
        <Button 
          onClick={onGoHome || (() => window.location.href = '/')}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Go Home
        </Button>
      </div>
    </div>
  </Card>
);

// Inline Error Component (for smaller errors within components)
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  size?: 'sm' | 'md';
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  onRetry,
  size = 'md',
}) => (
  <div className={`flex items-center gap-3 p-3 bg-red-900/20 border border-red-700/30 rounded-lg ${
    size === 'sm' ? 'text-sm' : ''
  }`}>
    <div className="text-red-400">⚠️</div>
    <div className="flex-1 text-red-200">{message}</div>
    {onRetry && (
      <Button 
        onClick={onRetry}
        size="sm"
        variant="outline"
        className="border-red-600 text-red-300 hover:bg-red-800/50"
      >
        Retry
      </Button>
    )}
  </div>
);