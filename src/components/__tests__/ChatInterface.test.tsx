import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../chat/ChatInterface';
import { ChatContext, ChatMessage } from '../../types/chat';

const mockContext: ChatContext = {
  sessionId: 'test-session',
  conversationHistory: [],
  currentStep: 'brand_selection',
  selectedPhones: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOnMessage = vi.fn();
const mockOnPhoneSelect = vi.fn();

describe('ChatInterface Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with input field', () => {
    render(
      <ChatInterface
        context={mockContext}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays conversation history', () => {
    const contextWithHistory: ChatContext = {
      ...mockContext,
      conversationHistory: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi! How can I help you compare phones?',
          timestamp: new Date(),
        },
      ],
    };

    render(
      <ChatInterface
        context={contextWithHistory}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi! How can I help you compare phones?')).toBeInTheDocument();
  });

  it('handles message submission', async () => {
    const user = userEvent.setup();
    render(
      <ChatInterface
        context={mockContext}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    const input = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Compare iPhone and Samsung');
    fireEvent.click(sendButton);
    
    expect(mockOnMessage).toHaveBeenCalledWith('Compare iPhone and Samsung');
    expect(input).toHaveValue('');
  });

  it('prevents submission of empty messages', async () => {
    const user = userEvent.setup();
    render(
      <ChatInterface
        context={mockContext}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockOnMessage).not.toHaveBeenCalled();
  });

  it('disables input during loading', () => {
    render(
      <ChatInterface
        context={mockContext}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={true}
      />
    );
    
    const input = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('shows typing indicator when loading', () => {
    render(
      <ChatInterface
        context={mockContext}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={true}
      />
    );
    
    expect(screen.getByText(/AI is thinking/i)).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(
      <ChatInterface
        context={mockContext}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    const input = screen.getByPlaceholderText(/Type your message/i);
    await user.type(input, 'Test message{enter}');
    
    expect(mockOnMessage).toHaveBeenCalledWith('Test message');
  });

  it('displays suggestions when available', () => {
    const contextWithSuggestions: ChatContext = {
      ...mockContext,
      suggestions: ['iPhone 15', 'Samsung Galaxy S24', 'Google Pixel 8'],
    };

    render(
      <ChatInterface
        context={contextWithSuggestions}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument();
    expect(screen.getByText('Google Pixel 8')).toBeInTheDocument();
  });

  it('handles suggestion clicks', async () => {
    const contextWithSuggestions: ChatContext = {
      ...mockContext,
      suggestions: ['iPhone 15'],
    };

    render(
      <ChatInterface
        context={contextWithSuggestions}
        onMessage={mockOnMessage}
        onPhoneSelect={mockOnPhoneSelect}
        isLoading={false}
      />
    );
    
    const suggestion = screen.getByText('iPhone 15');
    fireEvent.click(suggestion);
    
    expect(mockOnMessage).toHaveBeenCalledWith('iPhone 15');
  });
});