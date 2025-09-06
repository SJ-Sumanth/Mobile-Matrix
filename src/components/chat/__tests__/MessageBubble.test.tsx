import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import { ChatMessage } from '@/types/chat';
import { describe, it, expect } from 'vitest';

describe('MessageBubble', () => {
  const mockUserMessage: ChatMessage = {
    id: 'user-1',
    role: 'user',
    content: 'Hello, I want to compare phones',
    timestamp: new Date('2024-01-01T12:00:00Z'),
  };

  const mockAssistantMessage: ChatMessage = {
    id: 'assistant-1',
    role: 'assistant',
    content: 'Hi! I can help you compare phones. Which brands are you interested in?',
    timestamp: new Date('2024-01-01T12:01:00Z'),
  };

  const mockSystemMessage: ChatMessage = {
    id: 'system-1',
    role: 'system',
    content: 'System notification',
    timestamp: new Date('2024-01-01T12:02:00Z'),
  };

  it('renders user message with correct styling', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    const messageElement = screen.getByText('Hello, I want to compare phones');
    expect(messageElement).toBeInTheDocument();
    
    // Check if message is aligned to the right (user messages)
    const container = messageElement.closest('div')?.parentElement;
    expect(container).toHaveClass('justify-end');
    
    // Check user message styling
    const bubble = messageElement.closest('div');
    expect(bubble).toHaveClass('bg-primary', 'text-white');
  });

  it('renders assistant message with correct styling', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    
    const messageElement = screen.getByText(/Hi! I can help you compare phones/);
    expect(messageElement).toBeInTheDocument();
    
    // Check if message is aligned to the left (assistant messages)
    const container = messageElement.closest('div')?.parentElement;
    expect(container).toHaveClass('justify-start');
    
    // Check assistant message styling
    const bubble = messageElement.closest('div');
    expect(bubble).toHaveClass('bg-secondary/80', 'text-foreground');
  });

  it('renders system message with correct styling', () => {
    render(<MessageBubble message={mockSystemMessage} />);
    
    const messageElement = screen.getByText('System notification');
    expect(messageElement).toBeInTheDocument();
    
    // Check system message styling
    const bubble = messageElement.closest('div');
    expect(bubble).toHaveClass('bg-accent/50', 'text-foreground/80', 'italic');
  });

  it('displays timestamp correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    // The timestamp should be formatted as HH:MM (checking for any time format)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('handles multiline content correctly', () => {
    const multilineMessage: ChatMessage = {
      ...mockUserMessage,
      content: 'Line 1\nLine 2\nLine 3',
    };

    render(<MessageBubble message={multilineMessage} />);
    
    const messageElement = screen.getByText((content, element) => {
      return element?.textContent === 'Line 1\nLine 2\nLine 3';
    });
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveClass('whitespace-pre-wrap');
  });

  it('applies custom className', () => {
    render(<MessageBubble message={mockUserMessage} className="custom-class" />);
    
    const container = screen.getByText('Hello, I want to compare phones').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('handles long messages with word breaking', () => {
    const longMessage: ChatMessage = {
      ...mockUserMessage,
      content: 'This is a very long message that should break words properly when it exceeds the maximum width of the message bubble container',
    };

    render(<MessageBubble message={longMessage} />);
    
    const messageElement = screen.getByText(/This is a very long message/);
    expect(messageElement).toHaveClass('break-words');
  });
});