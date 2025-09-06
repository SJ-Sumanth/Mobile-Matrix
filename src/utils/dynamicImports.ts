import { lazy, ComponentType } from 'react';

/**
 * Dynamic import utilities for code splitting and performance optimization
 */

/**
 * Create a lazy-loaded component with error boundary and loading state
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): ComponentType<any> {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Suspense fallback={<ComponentLoader />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

/**
 * Preload a component for better performance
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Start loading the component in the background
  importFn().catch((error) => {
    console.warn('Failed to preload component:', error);
  });
}

/**
 * Dynamic import with retry logic
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

/**
 * Lazy load utility functions and services
 */
export const lazyServices = {
  // AI Service
  aiService: () => dynamicImportWithRetry(() => import('../services/ai.js')),
  
  // Phone Service
  phoneService: () => dynamicImportWithRetry(() => import('../services/phone.js')),
  
  // Comparison Service
  comparisonService: () => dynamicImportWithRetry(() => import('../services/comparison.js')),
  
  // External Services
  externalServices: () => dynamicImportWithRetry(() => import('../services/external/index.js')),
};

/**
 * Lazy load components
 */
export const LazyComponents = {
  // Chat Components
  ChatInterface: createLazyComponent(
    () => import('../components/chat/ChatInterface.js')
  ),
  
  ChatMessage: createLazyComponent(
    () => import('../components/chat/ChatMessage.js')
  ),
  
  // Comparison Components
  PhoneComparison: createLazyComponent(
    () => import('../components/comparison/PhoneComparison.js')
  ),
  
  ComparisonChart: createLazyComponent(
    () => import('../components/comparison/ComparisonChart.js')
  ),
  
  // Phone Components
  PhoneCard: createLazyComponent(
    () => import('../components/phone/PhoneCard.js')
  ),
  
  PhoneDetails: createLazyComponent(
    () => import('../components/phone/PhoneDetails.js')
  ),
  
  // UI Components
  ImageGallery: createLazyComponent(
    () => import('../components/ui/OptimizedImage.js').then(m => ({ default: m.ImageGallery }))
  ),
  
  // Error Components
  ErrorBoundary: createLazyComponent(
    () => import('../components/error/ErrorBoundary.js')
  ),
};

/**
 * Component loader with skeleton
 */
function ComponentLoader() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-32 w-full mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 rounded h-4 w-1/2"></div>
        <div className="bg-gray-200 rounded h-4 w-5/6"></div>
      </div>
    </div>
  );
}

/**
 * Error boundary for lazy components
 */
import { Component, ErrorInfo, ReactNode, Suspense } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent />;
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Component Loading Error</h3>
          <p className="text-red-600 text-sm">
            Failed to load component. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Route-based code splitting utilities
 */
export const LazyPages = {
  HomePage: createLazyComponent(
    () => import('../app/page.js')
  ),
  
  ComparisonPage: createLazyComponent(
    () => import('../app/comparison/page.js')
  ),
  
  AIDemo: createLazyComponent(
    () => import('../app/ai-demo/page.js')
  ),
  
  ErrorDemo: createLazyComponent(
    () => import('../app/error-demo/page.js')
  ),
};

/**
 * Preload critical components on app start
 */
export function preloadCriticalComponents(): void {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('../components/chat/ChatInterface.js'));
  preloadComponent(() => import('../components/phone/PhoneCard.js'));
  preloadComponent(() => import('../components/comparison/PhoneComparison.js'));
}

/**
 * Preload components based on user interaction
 */
export function preloadOnInteraction(componentName: keyof typeof LazyComponents): void {
  const preloadMap = {
    ChatInterface: () => import('../components/chat/ChatInterface.js'),
    ChatMessage: () => import('../components/chat/ChatMessage.js'),
    PhoneComparison: () => import('../components/comparison/PhoneComparison.js'),
    ComparisonChart: () => import('../components/comparison/ComparisonChart.js'),
    PhoneCard: () => import('../components/phone/PhoneCard.js'),
    PhoneDetails: () => import('../components/phone/PhoneDetails.js'),
    ImageGallery: () => import('../components/ui/OptimizedImage.js'),
    ErrorBoundary: () => import('../components/error/ErrorBoundary.js'),
  };
  
  const importFn = preloadMap[componentName];
  if (importFn) {
    preloadComponent(importFn);
  }
}

/**
 * Bundle analyzer helper for development
 */
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in development mode');
    // This would integrate with webpack-bundle-analyzer or similar tools
  }
}