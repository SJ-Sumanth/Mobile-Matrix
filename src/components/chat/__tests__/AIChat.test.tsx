import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChat } from '../AIChat';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import './setup';

describe('AIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial greeting message', () => {
    render(<AIChat />);
    
    expect(screen.getByText(/Hi! I'm here to help you compare phones/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('displays chat header with AI status', () => {
    render(<AIChat />);
    
    expect(screen.getByText('Phone Comparison Assistant')).toBeInTheDocument();
    expect(screen.getByText('Choose your brand')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows brand suggestions initially', () => {
    render(<AIChat />);
    
    expect(screen.getByText('Apple iPhone')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy')).toBeInTheDocument();
    expect(screen.getByText('OnePlus')).toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    const mockResponse = {
      success: true,
      data: {
        message: 'Great choice! Which iPhone model are you interested in?',
        nextStep: 'model_selection',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.change(input, { target: { value: 'I want to compare iPhones' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('I want to compare iPhones')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Great choice! Which iPhone model are you interested in?')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('I want to compare iPhones'),
    });
  });

  it('shows typing indicator while loading', async () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Response' } }),
      }), 100))
    );

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('AI is typing')).toBeInTheDocument();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/I'm sorry, I'm having trouble processing your request/)).toBeInTheDocument();
    });
  });

  it('calls onPhoneSelection callback when phones are selected', async () => {
    const onPhoneSelection = vi.fn();
    const mockResponse = {
      success: true,
      data: {
        message: 'Great! I found those phones.',
        extractedData: {
          selectedPhones: ['iPhone 15', 'Samsung Galaxy S24'],
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AIChat onPhoneSelection={onPhoneSelection} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Compare iPhone 15 and Galaxy S24' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(onPhoneSelection).toHaveBeenCalledWith(['iPhone 15', 'Samsung Galaxy S24']);
    });
  });

  it('disables input and send button while loading', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('clears input after sending message', async () => {
    const mockResponse = {
      success: true,
      data: { message: 'Response' },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    expect(input).toHaveValue('');
  });
});