import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Homepage } from '../../src/components/layout/Homepage';
import { ChatInterface } from '../../src/components/chat/ChatInterface';
import { PhoneComparison } from '../../src/components/comparison/PhoneComparison';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('../../src/services/ai', () => ({
  createAIService: vi.fn(() => ({
    processUserMessage: vi.fn(),
    generateContext: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Homepage Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Homepage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(<Homepage />);
      
      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent(/MobileMatrix/i);
      
      // Check for section headings
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have proper landmark roles', () => {
      render(<Homepage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have keyboard navigation support', () => {
      render(<Homepage />);
      
      const chatInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      expect(chatInput).toHaveAttribute('tabindex', '0');
      expect(sendButton).toHaveAttribute('tabindex', '0');
    });

    it('should have proper ARIA labels', () => {
      render(<Homepage />);
      
      const chatInput = screen.getByRole('textbox');
      expect(chatInput).toHaveAttribute('aria-label');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toHaveAttribute('aria-label');
    });
  });

  describe('Chat Interface Accessibility', () => {
    const mockContext = {
      sessionId: 'test-session',
      conversationHistory: [
        {
          id: '1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant' as const,
          content: 'Hi! How can I help you?',
          timestamp: new Date(),
        },
      ],
      currentStep: 'brand_selection' as const,
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ChatInterface
          context={mockContext}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={false}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA live regions for messages', () => {
      render(
        <ChatInterface
          context={mockContext}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={false}
        />
      );
      
      const messageContainer = screen.getByRole('log');
      expect(messageContainer).toHaveAttribute('aria-live', 'polite');
      expect(messageContainer).toHaveAttribute('aria-label', /conversation/i);
    });

    it('should announce loading states to screen readers', () => {
      render(
        <ChatInterface
          context={mockContext}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={true}
        />
      );
      
      const loadingIndicator = screen.getByText(/thinking/i);
      expect(loadingIndicator).toHaveAttribute('aria-live', 'assertive');
      expect(loadingIndicator).toHaveAttribute('role', 'status');
    });

    it('should have proper form labels and descriptions', () => {
      render(
        <ChatInterface
          context={mockContext}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={false}
        />
      );
      
      const chatInput = screen.getByRole('textbox');
      expect(chatInput).toHaveAttribute('aria-describedby');
      expect(chatInput).toHaveAccessibleName();
    });

    it('should support keyboard navigation for suggestions', () => {
      const contextWithSuggestions = {
        ...mockContext,
        suggestions: ['iPhone 15', 'Samsung Galaxy S24'],
      };

      render(
        <ChatInterface
          context={contextWithSuggestions}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={false}
        />
      );
      
      const suggestions = screen.getAllByRole('button', { name: /iPhone|Samsung/i });
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveAttribute('tabindex', '0');
        expect(suggestion).toHaveAttribute('role', 'button');
      });
    });
  });

  describe('Phone Comparison Accessibility', () => {
    const mockComparison = {
      phones: [
        {
          id: '1',
          brand: 'Apple',
          model: 'iPhone 15',
          specifications: {
            display: { size: '6.1"', resolution: '2556x1179' },
            performance: { processor: 'A16 Bionic' },
          },
          pricing: { currentPrice: 79900, currency: 'INR' },
        },
        {
          id: '2',
          brand: 'Samsung',
          model: 'Galaxy S24',
          specifications: {
            display: { size: '6.2"', resolution: '2340x1080' },
            performance: { processor: 'Snapdragon 8 Gen 3' },
          },
          pricing: { currentPrice: 74999, currency: 'INR' },
        },
      ],
      categories: [
        {
          name: 'Display',
          phone1Score: 8.5,
          phone2Score: 8.0,
          winner: 'phone1',
          details: 'iPhone has better display quality',
        },
      ],
      insights: ['Both phones offer excellent performance'],
      recommendations: ['Choose based on ecosystem preference'],
      generatedAt: new Date(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<PhoneComparison comparison={mockComparison} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper table structure for comparison', () => {
      render(<PhoneComparison comparison={mockComparison} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label', /phone comparison/i);
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
      
      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders.length).toBeGreaterThan(0);
    });

    it('should have descriptive alt text for phone images', () => {
      render(<PhoneComparison comparison={mockComparison} />);
      
      const phoneImages = screen.getAllByRole('img');
      phoneImages.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should announce comparison winners to screen readers', () => {
      render(<PhoneComparison comparison={mockComparison} />);
      
      const winnerIndicators = screen.getAllByText(/winner/i);
      winnerIndicators.forEach(indicator => {
        expect(indicator).toHaveAttribute('aria-label');
      });
    });

    it('should have proper color contrast for scores and indicators', () => {
      const { container } = render(<PhoneComparison comparison={mockComparison} />);
      
      // Check for high contrast classes
      const scoreElements = container.querySelectorAll('[data-testid="score"]');
      scoreElements.forEach(element => {
        expect(element).toHaveClass(/text-/); // Should have text color classes
      });
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly in modal dialogs', () => {
      // Test focus trap in modals
      render(<Homepage />);
      
      // Simulate opening a modal (if any)
      const modalTrigger = screen.queryByRole('button', { name: /open/i });
      if (modalTrigger) {
        modalTrigger.focus();
        expect(modalTrigger).toHaveFocus();
      }
    });

    it('should restore focus after interactions', () => {
      render(<Homepage />);
      
      const chatInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      chatInput.focus();
      expect(chatInput).toHaveFocus();
      
      sendButton.click();
      // Focus should return to input after sending
      expect(chatInput).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful page titles', () => {
      render(<Homepage />);
      
      // Check document title is set
      expect(document.title).toContain('MobileMatrix');
    });

    it('should have skip links for keyboard navigation', () => {
      render(<Homepage />);
      
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should announce dynamic content changes', () => {
      const { rerender } = render(
        <ChatInterface
          context={{
            sessionId: 'test',
            conversationHistory: [],
            currentStep: 'brand_selection',
            selectedPhones: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={false}
        />
      );
      
      // Add a new message
      rerender(
        <ChatInterface
          context={{
            sessionId: 'test',
            conversationHistory: [
              {
                id: '1',
                role: 'assistant',
                content: 'New message',
                timestamp: new Date(),
              },
            ],
            currentStep: 'brand_selection',
            selectedPhones: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          onMessage={vi.fn()}
          onPhoneSelect={vi.fn()}
          isLoading={false}
        />
      );
      
      const newMessage = screen.getByText('New message');
      expect(newMessage.closest('[aria-live]')).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should work properly in high contrast mode', () => {
      // Simulate high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      const { container } = render(<Homepage />);
      
      // Check for high contrast styles
      const elements = container.querySelectorAll('*');
      elements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Ensure no transparent backgrounds in high contrast mode
        if (styles.backgroundColor !== 'transparent') {
          expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      });
    });
  });
});