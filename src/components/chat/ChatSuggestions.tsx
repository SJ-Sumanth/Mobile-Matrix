'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '@/utils';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function ChatSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  className 
}: ChatSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className={cn('px-4 pb-2', className)}>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs border border-border/30 hover:border-primary/50 hover:bg-primary/10"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}