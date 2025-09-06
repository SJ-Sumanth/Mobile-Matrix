'use client';

import React, { useState } from 'react';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AIServiceFallback, PhoneDataFallback, NetworkErrorFallback } from './FallbackComponents';

/**
 * Demo component to showcase error handling functionality
 */
export const ErrorHandlingDemo: React.FC = () => {
  const [demoType, setDemoType] = useState<string>('');
  
  const aiErrorHandling = useErrorHandling({
    context: 'AI Service Demo',
    severity: 'medium',
  });

  const phoneDataErrorHandling = useErrorHandling({
    context: 'Phone Data Demo',
    severity: 'high',
  });

  const networkErrorHandling = useErrorHandling({
    context: 'Network Demo',
    severity: 'low',
  });

  // Simulate AI service error
  const simulateAIError = async () => {
    setDemoType('ai');
    await aiErrorHandling.executeWithErrorHandling(async () => {
      throw new Error('AI service is temporarily unavailable');
    });
  };

  // Simulate phone data error
  const simulatePhoneDataError = async () => {
    setDemoType('phoneData');
    await phoneDataErrorHandling.executeWithErrorHandling(async () => {
      throw new Error('Failed to load phone specifications');
    });
  };

  // Simulate network error
  const simulateNetworkError = async () => {
    setDemoType('network');
    await networkErrorHandling.executeWithErrorHandling(async () => {
      throw new Error('Network connection failed');
    });
  };

  // Simulate successful operation after retry
  const simulateRetrySuccess = async () => {
    setDemoType('retry');
    let attemptCount = 0;
    
    await aiErrorHandling.executeWithErrorHandling(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure - will succeed on retry');
      }
      return 'Success after retry!';
    });
  };

  const clearDemo = () => {
    setDemoType('');
    aiErrorHandling.clearError();
    phoneDataErrorHandling.clearError();
    networkErrorHandling.clearError();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Error Handling System Demo
        </h2>
        <p className="text-gray-300 mb-6">
          This demo showcases the comprehensive error handling system including error boundaries, 
          toast notifications, fallback UI components, retry mechanisms, and error logging.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={simulateAIError}
            disabled={aiErrorHandling.isRetrying}
            className="bg-red-600 hover:bg-red-700"
          >
            {aiErrorHandling.isRetrying ? 'Processing...' : 'AI Service Error'}
          </Button>

          <Button
            onClick={simulatePhoneDataError}
            disabled={phoneDataErrorHandling.isRetrying}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {phoneDataErrorHandling.isRetrying ? 'Processing...' : 'Phone Data Error'}
          </Button>

          <Button
            onClick={simulateNetworkError}
            disabled={networkErrorHandling.isRetrying}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {networkErrorHandling.isRetrying ? 'Processing...' : 'Network Error'}
          </Button>

          <Button
            onClick={simulateRetrySuccess}
            disabled={aiErrorHandling.isRetrying}
            className="bg-green-600 hover:bg-green-700"
          >
            {aiErrorHandling.isRetrying ? 'Retrying...' : 'Retry Success'}
          </Button>
        </div>

        <Button
          onClick={clearDemo}
          variant="outline"
          className="mb-6 border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Clear All Errors
        </Button>

        {/* Error State Display */}
        <div className="space-y-4">
          {aiErrorHandling.hasError && demoType === 'ai' && (
            <AIServiceFallback
              onRetry={simulateAIError}
              canRetry={aiErrorHandling.retryCount < 3}
              retryCount={aiErrorHandling.retryCount}
              maxRetries={3}
            />
          )}

          {phoneDataErrorHandling.hasError && demoType === 'phoneData' && (
            <PhoneDataFallback
              onRetry={simulatePhoneDataError}
              canRetry={phoneDataErrorHandling.retryCount < 3}
              retryCount={phoneDataErrorHandling.retryCount}
              maxRetries={3}
            />
          )}

          {networkErrorHandling.hasError && demoType === 'network' && (
            <NetworkErrorFallback
              onRetry={simulateNetworkError}
              canRetry={networkErrorHandling.retryCount < 3}
            />
          )}

          {!aiErrorHandling.hasError && 
           !phoneDataErrorHandling.hasError && 
           !networkErrorHandling.hasError && 
           demoType && (
            <Card className="p-4 bg-green-900/20 border-green-700/30">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h3 className="font-medium text-green-200">Operation Successful</h3>
                  <p className="text-sm text-green-300">
                    {demoType === 'retry' 
                      ? 'Operation succeeded after retry attempts'
                      : 'No errors detected in this demo'
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Error Statistics */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Error Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">AI Service</div>
              <div className="text-white">
                Retries: {aiErrorHandling.retryCount} | 
                Status: {aiErrorHandling.hasError ? 'Error' : aiErrorHandling.isRetrying ? 'Retrying' : 'OK'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Phone Data</div>
              <div className="text-white">
                Retries: {phoneDataErrorHandling.retryCount} | 
                Status: {phoneDataErrorHandling.hasError ? 'Error' : phoneDataErrorHandling.isRetrying ? 'Retrying' : 'OK'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Network</div>
              <div className="text-white">
                Retries: {networkErrorHandling.retryCount} | 
                Status: {networkErrorHandling.hasError ? 'Error' : networkErrorHandling.isRetrying ? 'Retrying' : 'OK'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Features Overview */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Error Handling Features Implemented
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-primary">Core Components</h4>
            <ul className="text-gray-300 space-y-1">
              <li>✅ Global Error Boundary</li>
              <li>✅ Toast Notification System</li>
              <li>✅ Fallback UI Components</li>
              <li>✅ Retry Mechanisms</li>
              <li>✅ Error Logging Service</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-primary">Advanced Features</h4>
            <ul className="text-gray-300 space-y-1">
              <li>✅ Exponential Backoff</li>
              <li>✅ Context-Aware Error Handling</li>
              <li>✅ Service-Specific Error Types</li>
              <li>✅ Error Recovery Suggestions</li>
              <li>✅ Comprehensive Test Coverage</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};