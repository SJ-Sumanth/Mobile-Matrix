'use client';

import React from 'react';

export function TailwindTest() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6">
          <span className="text-orange-500">Mobile</span>
          <span className="text-white">Matrix</span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">
          Testing Tailwind CSS - this should look exactly like the inline styles version
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-400">Smart recommendations</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Detailed Comparison</h3>
            <p className="text-sm text-gray-400">Side-by-side specs</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🇮🇳</div>
            <h3 className="text-lg font-semibold mb-2">India-Focused</h3>
            <p className="text-sm text-gray-400">Latest phones</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold">
            Start Comparing Now
          </button>
          
          <button className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold">
            Browse All Phones
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">200+</div>
            <div className="text-sm text-gray-400">Phone Models</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">15+</div>
            <div className="text-sm text-gray-400">Brands</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">50K+</div>
            <div className="text-sm text-gray-400">Comparisons</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">99%</div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
}