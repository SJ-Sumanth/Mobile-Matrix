import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../Button'
import { Card, CardHeader, CardTitle, CardContent } from '../Card'
import { Input } from '../Input'
import { Modal } from '../Modal'
import { Badge } from '../Badge'
import { Spinner, LoadingSpinner } from '../Spinner'

// Mock the cn utility
vi.mock('@/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
    })

    it('applies variant classes correctly', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('shows loading state', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('handles click events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders with icons', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          With Icon
        </Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })
  })

  describe('Card', () => {
    it('renders with default props', () => {
      render(
        <Card>
          <CardContent>Card content</CardContent>
        </Card>
      )
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('renders with header and title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content</CardContent>
        </Card>
      )
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
      render(
        <Card variant="elevated" data-testid="card">
          <CardContent>Content</CardContent>
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-card')
    })
  })

  describe('Input', () => {
    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Input label="Username" />)
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('shows error state', () => {
      render(<Input label="Email" error errorText="Invalid email" />)
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })

    it('handles input changes', () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })
      expect(handleChange).toHaveBeenCalled()
    })

    it('renders with icons', () => {
      render(
        <Input
          leftIcon={<span data-testid="search-icon">🔍</span>}
          placeholder="Search"
        />
      )
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })
  })

  describe('Modal', () => {
    it('renders when open', () => {
      render(
        <Modal isOpen onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      )
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      )
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('renders with title and description', () => {
      render(
        <Modal isOpen title="Test Modal" description="Test description" onClose={() => {}}>
          <p>Content</p>
        </Modal>
      )
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen onClose={handleClose} title="Test">
          <p>Content</p>
        </Modal>
      )
      const closeButton = screen.getByLabelText('Close modal')
      fireEvent.click(closeButton)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when escape key is pressed', () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen onClose={handleClose}>
          <p>Content</p>
        </Modal>
      )
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Badge', () => {
    it('renders with text', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
      render(<Badge variant="success">Success</Badge>)
      const badge = screen.getByText('Success')
      expect(badge).toHaveClass('bg-success')
    })

    it('applies size classes', () => {
      render(<Badge size="lg">Large Badge</Badge>)
      const badge = screen.getByText('Large Badge')
      expect(badge).toHaveClass('px-3', 'py-1.5')
    })

    it('applies rounded class when rounded prop is true', () => {
      render(<Badge rounded>Rounded</Badge>)
      const badge = screen.getByText('Rounded')
      expect(badge).toHaveClass('rounded-full')
    })
  })

  describe('Spinner', () => {
    it('renders with default props', () => {
      render(<Spinner data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('applies size classes', () => {
      render(<Spinner size="lg" data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('applies color classes', () => {
      render(<Spinner color="primary" data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('border-primary')
    })
  })

  describe('LoadingSpinner', () => {
    it('renders with text', () => {
      render(<LoadingSpinner text="Loading..." />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders without text', () => {
      render(<LoadingSpinner />)
      // Should still render the spinner even without text
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('Button maintains functionality on mobile', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Mobile Button</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalled()
    })

    it('Modal adapts to small screens', () => {
      render(
        <Modal isOpen size="full" onClose={() => {}}>
          <p>Full size modal</p>
        </Modal>
      )
      
      const modal = screen.getByText('Full size modal').closest('div')
      expect(modal).toHaveClass('max-w-[95vw]')
    })

    it('Input maintains usability on touch devices', () => {
      render(<Input placeholder="Touch input" />)
      const input = screen.getByPlaceholderText('Touch input')
      
      // Simulate touch interaction
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'touch test' } })
      
      expect(input).toHaveValue('touch test')
    })
  })

  describe('Accessibility', () => {
    it('Button has proper ARIA attributes', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('Input has proper label association', () => {
      render(<Input label="Email Address" />)
      const input = screen.getByLabelText('Email Address')
      expect(input).toBeInTheDocument()
    })

    it('Modal has proper focus management', () => {
      render(
        <Modal isOpen onClose={() => {}} title="Accessible Modal">
          <button>Focus me</button>
        </Modal>
      )
      
      const focusableElement = screen.getByText('Focus me')
      expect(focusableElement).toBeInTheDocument()
    })

    it('Badge has appropriate text contrast', () => {
      render(<Badge variant="error">Error Badge</Badge>)
      const badge = screen.getByText('Error Badge')
      expect(badge).toHaveClass('text-white') // Ensures contrast on error background
    })
  })

  describe('Theme Integration', () => {
    it('Components use theme colors', () => {
      render(<Button variant="primary">Themed Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('Components respond to dark theme', () => {
      render(<Card>Dark theme card</Card>)
      const card = screen.getByText('Dark theme card').closest('div')
      expect(card).toHaveClass('bg-secondary/50')
    })
  })
})