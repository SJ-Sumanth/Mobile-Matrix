'use client';

import React, { useState, useRef } from 'react';
import { HeroSection } from './HeroSection';
import { BrandShowcase } from './BrandShowcase';
import { AIChat } from '../chat/AIChat';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '@/utils';

interface HomepageProps {
  className?: string;
}

export function Homepage({ className }: HomepageProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [chatComponent, setChatComponent] = useState<any>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleStartComparison = () => {
    setIsChatOpen(true);
    // Scroll to chat section
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  const handlePhoneSelection = (phones: string[]) => {
    setSelectedPhones(phones);
  };

  const handleComparisonReady = (comparisonData: any) => {
    console.log('Comparison ready:', comparisonData);
    // This would typically navigate to a comparison page or show results
  };

  const handlePopularComparisonClick = (comparison: string) => {
    console.log('Popular comparison clicked:', comparison);
    setIsChatOpen(true);
    // Scroll to chat section first
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      // Then send the comparison message after a short delay
      setTimeout(() => {
        console.log('Attempting to send message, chatComponent:', chatComponent);
        if (chatComponent && chatComponent.sendMessage) {
          console.log('Sending comparison message:', `Compare ${comparison}`);
          chatComponent.sendMessage(`Compare ${comparison}`);
        } else {
          console.log('Chat component not ready, trying again...');
          // Try again after another delay
          setTimeout(() => {
            if (chatComponent && chatComponent.sendMessage) {
              chatComponent.sendMessage(`Compare ${comparison}`);
            }
          }, 1000);
        }
      }, 500);
    }, 100);
  };

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Hero Section */}
      <section className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <HeroSection onStartComparison={handleStartComparison} />
        </div>
      </section>

      {/* Brand Showcase */}
      <section className="w-full py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BrandShowcase />
        </div>
      </section>

      {/* AI Chat Section */}
      <section className="w-full py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              AI-Powered Phone Comparison
            </h2>
            <p className="text-foreground/70 text-sm md:text-base max-w-2xl mx-auto">
              Chat with our AI assistant to find and compare the perfect phones for your needs. 
              Get personalized recommendations based on your preferences and budget.
            </p>
          </div>

          <div ref={chatRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              {isChatOpen ? (
                <AIChat
                  onPhoneSelection={handlePhoneSelection}
                  onComparisonReady={handleComparisonReady}
                  onRef={setChatComponent}
                  className="h-[800px]"
                />
              ) : (
                <Card 
                  className="h-[800px] flex flex-col items-center justify-center text-center cursor-pointer group"
                  variant="glass"
                  hover
                  onClick={handleStartComparison}
                >
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Start Your Phone Comparison Journey
                  </h3>
                  <p className="text-foreground/70 mb-6 max-w-md">
                    Click here to begin chatting with our AI assistant. 
                    We'll help you find the perfect phone based on your needs.
                  </p>
                  <Button size="lg" className="shadow-orange-glow">
                    Start Chat
                  </Button>
                </Card>
              )}
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Why Choose MobileMatrix?</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">⚡</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Instant Results</div>
                      <div className="text-xs text-foreground/60">Get comparisons in seconds</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">🎯</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Accurate Data</div>
                      <div className="text-xs text-foreground/60">Latest specs and pricing</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">🤖</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Smart AI</div>
                      <div className="text-xs text-foreground/60">Personalized recommendations</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Selected Phones */}
              {selectedPhones.length > 0 && (
                <Card variant="elevated" className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Selected Phones</h3>
                  <div className="space-y-2">
                    {selectedPhones.map((phone, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md"
                      >
                        <span className="text-primary">📱</span>
                        <span className="text-sm text-foreground">{phone}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Popular Comparisons */}
              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Popular Comparisons</h3>
                <div className="space-y-3">
                  {[
                    'iPhone 15 vs Samsung Galaxy S24',
                    'OnePlus 12 vs Xiaomi 14',
                    'Realme GT 6 vs Nothing Phone 2',
                    'Samsung Galaxy A54 vs OnePlus Nord 3',
                    'iPhone 15 Pro vs OnePlus 12',
                  ].map((comparison, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary/30 rounded-md transition-colors border border-transparent hover:border-primary/20"
                      onClick={() => handlePopularComparisonClick(comparison)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{comparison}</span>
                        <span className="text-xs text-primary">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-secondary/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Everything You Need to Make the Right Choice
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Our comprehensive comparison platform provides all the tools and information 
              you need to find your perfect phone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'Detailed Specifications',
                description: 'Compare every aspect from display quality to battery life with precise technical details.'
              },
              {
                icon: '💰',
                title: 'Real-time Pricing',
                description: 'Get the latest prices from multiple retailers and find the best deals available.'
              },
              {
                icon: '⭐',
                title: 'Expert Reviews',
                description: 'Access professional reviews and user ratings to make informed decisions.'
              },
              {
                icon: '🔄',
                title: 'Side-by-Side Comparison',
                description: 'Visual comparison tools that highlight key differences and similarities.'
              },
              {
                icon: '🎯',
                title: 'Personalized Recommendations',
                description: 'AI-powered suggestions based on your usage patterns and preferences.'
              },
              {
                icon: '📱',
                title: 'Latest Models',
                description: 'Stay updated with the newest phone releases and upcoming launches.'
              },
            ].map((feature, index) => (
              <Card key={index} variant="elevated" hover className="p-6 text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-foreground/70">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}