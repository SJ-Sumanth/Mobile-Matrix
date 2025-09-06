import React, { useEffect, useState } from 'react'
import { cn } from '@/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 300)
  }

  const typeStyles = {
    success: {
      bg: 'bg-success/10 border-success/20',
      icon: 'text-success',
      iconPath: 'M5 13l4 4L19 7',
    },
    error: {
      bg: 'bg-error/10 border-error/20',
      icon: 'text-error',
      iconPath: 'M6 18L18 6M6 6l12 12',
    },
    warning: {
      bg: 'bg-warning/10 border-warning/20',
      icon: 'text-warning',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    info: {
      bg: 'bg-primary/10 border-primary/20',
      icon: 'text-primary',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  }

  const currentStyle = typeStyles[type]

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
        'shadow-lg transition-all duration-300 ease-out',
        currentStyle.bg,
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95',
        isExiting && 'translate-x-full opacity-0 scale-95'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', currentStyle.icon)}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={currentStyle.iconPath}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-foreground mb-1">
            {title}
          </p>
        )}
        {description && (
          <p className="text-sm text-foreground/70">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-2 text-sm font-medium underline hover:no-underline',
              currentStyle.icon
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-md text-foreground/50 hover:text-foreground hover:bg-black/10 transition-colors"
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

// Toast Container Component
export interface ToastContainerProps {
  toasts: ToastProps[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
}) => {
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 max-w-sm w-full',
        positions[position]
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

export { Toast, ToastContainer }