'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '@/utils';
import { ChatMessage, ChatContext, ChatStep } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatSuggestions } from './ChatSuggestions';

interface AIChatProps {
  className?: string;
  onPhoneSelection?: (phones: string[]) => void;
  onComparisonReady?: (comparisonData: any) => void;
  onRef?: (ref: any) => void;
}

export function AIChat({ className, onPhoneSelection, onComparisonReady, onRef }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ChatContext>({
    sessionId: `session_${Date.now()}`,
    conversationHistory: [],
    currentStep: 'brand_selection',
    selectedPhones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: ChatMessage = {
        id: 'initial',
        role: 'assistant',
        content: "Hi! I'm here to help you compare phones. Which brand are you interested in? I can help you compare phones from Apple, Samsung, OnePlus, Xiaomi, Realme, and many more!",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [messages.length]);

  // Expose sendMessage method to parent
  useEffect(() => {
    if (onRef) {
      onRef({
        sendMessage: (message: string) => {
          console.log('Sending message from parent:', message);
          sendMessage(message);
        }
      });
    }
  }, [onRef]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: {
            ...context,
            conversationHistory: [...context.conversationHistory, userMessage],
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.success) {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Update context based on AI response
        const updatedContext = {
          ...context,
          conversationHistory: [...context.conversationHistory, userMessage, aiMessage],
          currentStep: data.data.nextStep || context.currentStep,
          updatedAt: new Date(),
        };
        
        setContext(updatedContext);
        
        // Handle phone selection callbacks
        if (data.data.extractedData?.selectedPhones) {
          onPhoneSelection?.(data.data.extractedData.selectedPhones);
        }
        
        if (updatedContext.currentStep === 'comparison' && updatedContext.selectedPhones.length >= 2) {
          onComparisonReady?.(data.data);
        }
      } else {
        throw new Error(data.error?.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <Card className={cn('flex flex-col h-full min-h-[800px] max-h-[900px]', className)} variant="glass">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Phone Comparison Assistant</h3>
            <p className="text-xs text-foreground/60">
              {context.currentStep === 'brand_selection' && 'Choose your brand'}
              {context.currentStep === 'model_selection' && 'Select phone models'}
              {context.currentStep === 'comparison' && 'Comparing phones'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isLoading ? 'bg-warning animate-pulse' : 'bg-success'
          )} />
          <span className="text-xs text-foreground/60">
            {isLoading ? 'Thinking...' : 'Online'}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {!isLoading && context.currentStep === 'brand_selection' && (
        <ChatSuggestions
          suggestions={['Apple iPhone', 'Samsung Galaxy', 'OnePlus', 'Xiaomi', 'Realme']}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-border/30">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 text-base py-3"
            variant="filled"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            loading={isLoading}
            size="lg"
            className="px-8"
          >
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
}