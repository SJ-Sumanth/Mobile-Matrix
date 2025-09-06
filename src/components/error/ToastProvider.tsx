'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastProps } from '@/components/ui/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
  showSuccess: (title: string, description?: string, action?: ToastProps['action']) => string;
  showError: (title: string, description?: string, action?: ToastProps['action']) => string;
  showWarning: (title: string, description?: string, action?: ToastProps['action']) => string;
  showInfo: (title: string, description?: string, action?: ToastProps['action']) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastProps['position'];
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right',
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = generateId();
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId: string) => hideToast(toastId),
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [generateId, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, description?: string, action?: ToastProps['action']) => {
    return showToast({
      type: 'success',
      title,
      description,
      action,
      duration: 5000,
    });
  }, [showToast]);

  const showError = useCallback((title: string, description?: string, action?: ToastProps['action']) => {
    return showToast({
      type: 'error',
      title,
      description,
      action,
      duration: 8000, // Longer duration for errors
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, description?: string, action?: ToastProps['action']) => {
    return showToast({
      type: 'warning',
      title,
      description,
      action,
      duration: 6000,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string, action?: ToastProps['action']) => {
    return showToast({
      type: 'info',
      title,
      description,
      action,
      duration: 5000,
    });
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} position={position} />
    </ToastContext.Provider>
  );
};

// Hook for error handling with toast notifications
export const useErrorToast = () => {
  const { showError, showWarning } = useToast();

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const title = context ? `${context} Error` : 'Error';
    
    showError(title, errorMessage, {
      label: 'Report Issue',
      onClick: () => {
        // You can implement error reporting here
        console.error('Error reported:', { error, context });
      }
    });
  }, [showError]);

  const handleWarning = useCallback((message: string, context?: string) => {
    const title = context ? `${context} Warning` : 'Warning';
    showWarning(title, message);
  }, [showWarning]);

  return {
    handleError,
    handleWarning,
  };
};