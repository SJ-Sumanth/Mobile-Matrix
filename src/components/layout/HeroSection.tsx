'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '@/utils';

interface HeroSectionProps {
  onStartComparison?: () => void;
  className?: string;
}

export function HeroSection({ onStartComparison, className }: HeroSectionProps) {
  return (
    <div className={cn('w-full text-center py-12 md:py-20', className)}>
      {/* Main Heading */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
          <span className="text-orange-500">Mobile</span>
          <span className="text-white">Matrix</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          AI-powered phone comparison platform that helps you make the perfect choice. 
          Compare specifications, prices, and features across all brands launched in India.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
        <div className="flex flex-col items-center p-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="font-semibold text-white mb-2">AI-Powered</h3>
          <p className="text-sm text-gray-400 text-center">
            Smart recommendations based on your needs and preferences
          </p>
        </div>
        
        <div className="flex flex-col items-center p-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Detailed Comparison</h3>
          <p className="text-sm text-gray-400 text-center">
            Side-by-side specs, pricing, and performance analysis
          </p>
        </div>
        
        <div className="flex flex-col items-center p-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl">🇮🇳</span>
          </div>
          <h3 className="font-semibold text-white mb-2">India-Focused</h3>
          <p className="text-sm text-gray-400 text-center">
            Latest phones, Indian pricing, and local availability
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <button
          onClick={onStartComparison}
          className="px-8 py-4 text-lg font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Start Comparing Now
        </button>
        
        <button className="px-8 py-4 text-lg border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
          Browse All Phones
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">200+</div>
          <div className="text-sm text-gray-400">Phone Models</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">15+</div>
          <div className="text-sm text-gray-400">Brands</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">50K+</div>
          <div className="text-sm text-gray-400">Comparisons</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">99%</div>
          <div className="text-sm text-gray-400">Accuracy</div>
        </div>
      </div>
    </div>
  );
}