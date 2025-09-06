# Error Handling System

This directory contains a comprehensive error handling and user feedback system for the MobileMatrix application. The system provides robust error recovery, user-friendly feedback, and detailed error logging.

## 🚀 Features Implemented

### ✅ Global Error Boundary Components
- **ErrorBoundary**: React error boundary with different levels (component, page, critical)
- **withErrorBoundary**: Higher-order component for easy error boundary wrapping
- **Specialized Boundaries**: Pre-configured boundaries for different use cases
- **Retry Logic**: Built-in retry functionality with attempt limits
- **Graceful Degradation**: Fallback UI based on error severity

### ✅ Toast Notification System
- **ToastProvider**: Context provider for global toast management
- **useToast**: Hook for showing success, error, warning, and info toasts
- **useErrorToast**: Specialized hook for error notifications with reporting
- **Auto-dismiss**: Configurable duration with manual close options
- **Position Control**: Customizable toast positioning
- **Queue Management**: Automatic toast limiting and queuing

### ✅ Fallback UI Components
- **AIServiceFallback**: Specialized fallback for AI service errors
- **PhoneDataFallback**: Fallback for phone data loading errors
- **ComparisonFallback**: Fallback for comparison service errors
- **NetworkErrorFallback**: Network-specific error handling
- **LoadingFallback**: Loading states with error handling
- **GenericErrorFallback**: Configurable fallback for any error type
- **InlineError**: Compact error display for smaller components

### ✅ Retry Mechanisms with Exponential Backoff
- **retryWithBackoff**: Core retry function with configurable options
- **RetryConditions**: Pre-defined conditions for different error types
- **RetryConfigs**: Pre-configured retry strategies
- **useRetry**: React hook for retry functionality
- **fetchWithRetry**: Enhanced fetch with automatic retry
- **Jitter Support**: Prevents thundering herd problems

### ✅ Error Logging and Monitoring
- **ErrorLoggingService**: Centralized error logging with queuing
- **Automatic Collection**: Unhandled errors and promise rejections
- **Context Enrichment**: User, session, and request context
- **Batch Processing**: Efficient error submission
- **Fallback Storage**: localStorage backup when service unavailable
- **API Integration**: RESTful endpoint for error submission

### ✅ Comprehensive Error Handling Hooks
- **useErrorHandling**: Main hook with retry and logging integration
- **useServiceErrorHandling**: Service-specific error handling
- **useAPIErrorHandling**: API-specific error handling
- **useAIErrorHandling**: AI service error handling
- **useDatabaseErrorHandling**: Database error handling

## 📁 File Structure

```
src/components/error/
├── ErrorBoundary.tsx          # React error boundaries
├── ToastProvider.tsx          # Toast notification system
├── FallbackComponents.tsx     # Fallback UI components
├── ErrorHandlingDemo.tsx      # Demo component
├── index.ts                   # Exports
└── __tests__/                 # Test files
    ├── ErrorBoundary.test.tsx
    ├── ToastProvider.test.tsx
    └── ErrorHandling.integration.test.tsx

src/hooks/
├── useErrorHandling.ts        # Error handling hooks
└── __tests__/
    └── useErrorHandling.test.ts

src/utils/
├── retry.ts                   # Retry mechanisms
└── __tests__/
    └── retry.test.ts

src/services/
├── errorLogging.ts            # Error logging service
└── __tests__/
    └── errorLogging.test.ts

src/app/api/errors/
└── log/
    └── route.ts               # Error logging API endpoint
```

## 🔧 Usage Examples

### Basic Error Boundary

```tsx
import { ErrorBoundary } from '@/components/error';

function App() {
  return (
    <ErrorBoundary level="page">
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Toast Notifications

```tsx
import { useToast } from '@/components/error';

function MyComponent() {
  const { showError, showSuccess } = useToast();
  
  const handleAction = async () => {
    try {
      await someAsyncOperation();
      showSuccess('Success!', 'Operation completed successfully');
    } catch (error) {
      showError('Error', error.message);
    }
  };
}
```

### Error Handling with Retry

```tsx
import { useErrorHandling } from '@/hooks/useErrorHandling';

function DataComponent() {
  const { executeWithErrorHandling, isRetrying, hasError } = useErrorHandling({
    context: 'Data Loading',
    severity: 'medium',
  });
  
  const loadData = async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to load data');
      return response.json();
    });
    
    if (result) {
      // Handle successful data
    }
  };
  
  if (hasError) {
    return <DataFallback onRetry={loadData} />;
  }
  
  return (
    <button onClick={loadData} disabled={isRetrying}>
      {isRetrying ? 'Loading...' : 'Load Data'}
    </button>
  );
}
```

### Custom Retry Logic

```tsx
import { retryWithBackoff, RetryConfigs } from '@/utils/retry';

async function robustAPICall() {
  const result = await retryWithBackoff(
    () => fetch('/api/endpoint'),
    {
      ...RetryConfigs.aggressive,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}: ${error.message}`);
      },
    }
  );
  
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
}
```

## 🧪 Testing

The system includes comprehensive tests covering:

- **Unit Tests**: Individual component and hook testing
- **Integration Tests**: End-to-end error handling flows
- **Error Scenarios**: Various error types and recovery paths
- **Retry Logic**: Exponential backoff and retry conditions
- **Toast Notifications**: Display and interaction testing

Run tests with:
```bash
npm test error
```

## 🔄 Error Flow

1. **Error Occurs**: Component throws error or async operation fails
2. **Error Boundary**: Catches React errors and displays fallback UI
3. **Error Logging**: Automatically logs error with context
4. **Toast Notification**: Shows user-friendly error message
5. **Retry Logic**: Attempts retry with exponential backoff
6. **Fallback UI**: Displays appropriate fallback component
7. **Recovery Options**: Provides user actions for recovery

## 🎯 Error Types Handled

- **Network Errors**: Connection failures, timeouts
- **API Errors**: Server errors, rate limits, validation failures
- **AI Service Errors**: Model unavailable, context too large
- **Database Errors**: Connection issues, query failures
- **Validation Errors**: Input validation, schema errors
- **Authentication Errors**: Unauthorized, session expired
- **Component Errors**: React component crashes

## 📊 Monitoring and Analytics

The error logging system provides:

- **Error Frequency**: Track error occurrence rates
- **Error Patterns**: Identify common failure points
- **User Impact**: Understand error impact on user experience
- **Recovery Success**: Monitor retry success rates
- **Performance Metrics**: Track error handling performance

## 🔧 Configuration

### Environment Variables

```env
# Error logging endpoint (optional)
NEXT_PUBLIC_ERROR_LOGGING_ENDPOINT=/api/errors/log

# Error logging level (optional)
NEXT_PUBLIC_ERROR_LOG_LEVEL=medium

# Retry configuration (optional)
NEXT_PUBLIC_MAX_RETRY_ATTEMPTS=3
NEXT_PUBLIC_RETRY_BASE_DELAY=1000
```

### Toast Provider Setup

```tsx
// app/layout.tsx
import { ToastProvider } from '@/components/error';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider position="top-right" maxToasts={5}>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

## 🚀 Demo

Visit `/error-demo` to see the error handling system in action with interactive examples of:

- Different error types and severities
- Retry mechanisms with exponential backoff
- Fallback UI components
- Toast notifications
- Error recovery flows

## 🤝 Contributing

When adding new error handling:

1. **Use Existing Hooks**: Leverage `useErrorHandling` for consistency
2. **Add Fallback UI**: Create appropriate fallback components
3. **Include Tests**: Write tests for error scenarios
4. **Document Errors**: Add error types to the logging system
5. **Follow Patterns**: Use established error handling patterns

## 📝 Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 2.3**: User-friendly error messages and recovery suggestions
- **Requirement 5.4**: Robust error handling for external service failures
- **Requirement 1.3**: Responsive and reliable user interface

All sub-tasks have been completed:
- ✅ Global error boundary components for React error handling
- ✅ User-friendly error messages and recovery suggestions
- ✅ Toast notifications for success and error states
- ✅ Fallback UI components for service failures
- ✅ Retry mechanisms with exponential backoff
- ✅ Error logging and monitoring integration
- ✅ Comprehensive tests for error scenarios and recovery flows