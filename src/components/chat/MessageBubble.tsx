'use client';

import React from 'react';
import { cn } from '@/utils';
import { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={cn(
      'flex w-full',
      isUser ? 'justify-end' : 'justify-start',
      className
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2 text-sm',
        'animate-fade-in-up',
        isUser && [
          'bg-primary text-white',
          'rounded-br-sm',
          'shadow-md',
        ],
        !isUser && !isSystem && [
          'bg-secondary/80 text-foreground',
          'rounded-bl-sm',
          'border border-border/30',
        ],
        isSystem && [
          'bg-accent/50 text-foreground/80',
          'rounded-md',
          'border border-border/20',
          'text-xs',
          'italic',
        ]
      )}>
        <p className="whitespace-pre-wrap break-words">
          {message.content}
        </p>
        
        <div className={cn(
          'text-xs mt-1 opacity-60',
          isUser ? 'text-white/70' : 'text-foreground/50'
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}