'use client';

import React from 'react';
import { PageErrorBoundary } from '@/components/error/ErrorBoundary';
import { ErrorHandlingDemo } from '@/components/error/ErrorHandlingDemo';

export default function ErrorDemoPage() {
  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-primary">Mobile</span>Matrix
            </h1>
            <h2 className="text-2xl font-semibold text-gray-300">
              Error Handling System Demo
            </h2>
          </div>
          
          <ErrorHandlingDemo />
        </div>
      </div>
    </PageErrorBoundary>
  );
}