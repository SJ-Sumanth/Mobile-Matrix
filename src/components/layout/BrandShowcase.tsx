'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { cn } from '@/utils';

interface Brand {
  name: string;
  logo: string;
  gradient: string;
  phones: number;
}

const brands: Brand[] = [
  { name: 'Apple', logo: '🍎', gradient: 'from-gray-800 to-gray-600', phones: 25 },
  { name: 'Samsung', logo: '📱', gradient: 'from-blue-600 to-blue-800', phones: 45 },
  { name: 'OnePlus', logo: '⚡', gradient: 'from-red-600 to-red-800', phones: 18 },
  { name: 'Xiaomi', logo: '🔥', gradient: 'from-orange-600 to-orange-800', phones: 35 },
  { name: 'Realme', logo: '💫', gradient: 'from-yellow-600 to-yellow-800', phones: 28 },
  { name: 'Vivo', logo: '🌟', gradient: 'from-purple-600 to-purple-800', phones: 22 },
  { name: 'Oppo', logo: '✨', gradient: 'from-green-600 to-green-800', phones: 20 },
  { name: 'Google', logo: '🎯', gradient: 'from-indigo-600 to-indigo-800', phones: 12 },
];

interface BrandShowcaseProps {
  className?: string;
}

export function BrandShowcase({ className }: BrandShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate brands
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(brands.length / 4));
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const visibleBrands = brands.slice(currentIndex * 4, (currentIndex + 1) * 4);
  if (visibleBrands.length < 4) {
    visibleBrands.push(...brands.slice(0, 4 - visibleBrands.length));
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Compare Phones from Top Brands
        </h2>
        <p className="text-foreground/70 text-sm md:text-base">
          Discover the perfect phone from over 200+ models across all major brands
        </p>
      </div>

      <div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {visibleBrands.map((brand, index) => (
          <Card
            key={`${brand.name}-${currentIndex}-${index}`}
            className={cn(
              'relative overflow-hidden cursor-pointer group',
              'hover:scale-105 transition-all duration-300',
              'animate-fade-in'
            )}
            variant="glass"
            hover
          >
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity',
              brand.gradient
            )} />
            
            <div className="relative z-10 text-center p-4">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {brand.logo}
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {brand.name}
              </h3>
              <p className="text-xs text-foreground/60">
                {brand.phones} models
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: Math.ceil(brands.length / 4) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200',
              index === currentIndex 
                ? 'bg-primary w-6' 
                : 'bg-border hover:bg-primary/50'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}