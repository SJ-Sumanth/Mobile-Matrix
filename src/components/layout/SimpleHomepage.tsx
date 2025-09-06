'use client';

import React from 'react';

export function SimpleHomepage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6">
            <span className="text-orange-500">Mobile</span>
            <span className="text-white">Matrix</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            AI-powered phone comparison platform that helps you make the perfect choice. 
            Compare specifications, prices, and features across all brands launched in India.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-400">Smart recommendations based on your needs</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Detailed Comparison</h3>
              <p className="text-sm text-gray-400">Side-by-side specs and analysis</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🇮🇳</div>
              <h3 className="text-lg font-semibold mb-2">India-Focused</h3>
              <p className="text-sm text-gray-400">Latest phones and Indian pricing</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Start Comparing Now
            </button>
            
            <button className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Browse All Phones
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
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
      </section>

      {/* Brand Showcase */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Compare Phones from Top Brands</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">🍎</div>
              <h3 className="font-semibold">Apple</h3>
              <p className="text-sm text-gray-400">25 models</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-semibold">Samsung</h3>
              <p className="text-sm text-gray-400">45 models</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold">OnePlus</h3>
              <p className="text-sm text-gray-400">18 models</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="font-semibold">Xiaomi</h3>
              <p className="text-sm text-gray-400">35 models</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">AI-Powered Phone Comparison</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Chat with our AI assistant to find and compare the perfect phones for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Interface Placeholder */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-lg p-8 h-96 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-4">Start Your Phone Comparison Journey</h3>
                <p className="text-gray-400 mb-6">
                  Click here to begin chatting with our AI assistant.
                </p>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Start Chat
                </button>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Why Choose MobileMatrix?</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500">⚡</span>
                    <div>
                      <div className="font-medium">Instant Results</div>
                      <div className="text-xs text-gray-400">Get comparisons in seconds</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500">🎯</span>
                    <div>
                      <div className="font-medium">Accurate Data</div>
                      <div className="text-xs text-gray-400">Latest specs and pricing</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500">🤖</span>
                    <div>
                      <div className="font-medium">Smart AI</div>
                      <div className="text-xs text-gray-400">Personalized recommendations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}