import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast, useErrorToast } from '../ToastProvider';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Test component that uses the toast hook
const TestComponent: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, clearAll } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Success', 'Success message')}>
        Show Success
      </button>
      <button onClick={() => showError('Error', 'Error message')}>
        Show Error
      </button>
      <button onClick={() => showWarning('Warning', 'Warning message')}>
        Show Warning
      </button>
      <button onClick={() => showInfo('Info', 'Info message')}>
        Show Info
      </button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
};

// Test component for error toast hook
const ErrorTestComponent: React.FC = () => {
  const { handleError, handleWarning } = useErrorToast();

  return (
    <div>
      <button onClick={() => handleError('Test error', 'Test Context')}>
        Handle Error
      </button>
      <button onClick={() => handleWarning('Test warning', 'Test Context')}>
        Handle Warning
      </button>
    </div>
  );
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides toast context to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    console.error = originalError;
  });

  it('shows success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('shows error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('shows warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Warning'));

    await waitFor(() => {
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  it('shows info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    await waitFor(() => {
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  it('clears all toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // Clear all toasts
    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  it('limits number of toasts', async () => {
    render(
      <ToastProvider maxToasts={2}>
        <TestComponent />
      </ToastProvider>
    );

    // Show 3 toasts (should only keep 2)
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Warning'));

    await waitFor(() => {
      // Should only show the last 2 toasts
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });
  });

  it('closes toast when close button is clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });
  });
});

describe('useErrorToast', () => {
  it('handles errors with toast notifications', async () => {
    render(
      <ToastProvider>
        <ErrorTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Error'));

    await waitFor(() => {
      expect(screen.getByText('Test Context Error')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('handles warnings with toast notifications', async () => {
    render(
      <ToastProvider>
        <ErrorTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Warning'));

    await waitFor(() => {
      expect(screen.getByText('Test Context Warning')).toBeInTheDocument();
      expect(screen.getByText('Test warning')).toBeInTheDocument();
    });
  });
});