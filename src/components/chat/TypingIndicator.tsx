'use client';

import React from 'react';
import { cn } from '@/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex justify-start', className)}>
      <div className="bg-secondary/80 border border-border/30 rounded-lg rounded-bl-sm px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-1">
          <span className="text-foreground/60 text-sm">AI is typing</span>
          <div className="flex gap-1 ml-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}