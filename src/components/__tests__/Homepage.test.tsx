import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Homepage } from '../layout/Homepage';

// Mock the AI service
vi.mock('../../services/ai', () => ({
  createAIService: vi.fn(() => ({
    processUserMessage: vi.fn(),
    generateContext: vi.fn(),
  })),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Homepage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders homepage with chat interface', () => {
    render(<Homepage />);
    
    expect(screen.getByText(/MobileMatrix/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-powered phone comparison/i)).toBeInTheDocument();
  });

  it('displays chat input field', () => {
    render(<Homepage />);
    
    const chatInput = screen.getByPlaceholderText(/Ask me about phones/i);
    expect(chatInput).toBeInTheDocument();
  });

  it('handles user input in chat', async () => {
    const user = userEvent.setup();
    render(<Homepage />);
    
    const chatInput = screen.getByPlaceholderText(/Ask me about phones/i);
    await user.type(chatInput, 'Compare iPhone 15 and Samsung Galaxy S24');
    
    expect(chatInput).toHaveValue('Compare iPhone 15 and Samsung Galaxy S24');
  });

  it('submits chat message on enter key', async () => {
    const user = userEvent.setup();
    render(<Homepage />);
    
    const chatInput = screen.getByPlaceholderText(/Ask me about phones/i);
    await user.type(chatInput, 'Hello{enter}');
    
    // Should clear input after submission
    expect(chatInput).toHaveValue('');
  });

  it('displays loading state during AI processing', async () => {
    render(<Homepage />);
    
    const chatInput = screen.getByPlaceholderText(/Ask me about phones/i);
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(chatInput, 'Test message');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    });
  });

  it('renders brand showcase section', () => {
    render(<Homepage />);
    
    expect(screen.getByText(/Popular Brands/i)).toBeInTheDocument();
  });

  it('has responsive design classes', () => {
    const { container } = render(<Homepage />);
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('min-h-screen');
  });
});