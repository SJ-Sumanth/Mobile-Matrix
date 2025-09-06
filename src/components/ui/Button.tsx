import React from 'react'
import { cn } from '@/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2',
      'font-medium rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-95',
    ]

    const variants = {
      primary: [
        'bg-primary text-white shadow-md',
        'hover:bg-primary-dark hover:shadow-orange-glow',
        'active:bg-primary-dark',
      ],
      secondary: [
        'bg-secondary text-foreground border border-border',
        'hover:bg-accent hover:border-primary/30',
        'active:bg-accent',
      ],
      outline: [
        'border-2 border-primary text-primary bg-transparent',
        'hover:bg-primary hover:text-white hover:shadow-orange-glow',
        'active:bg-primary-dark active:border-primary-dark',
      ],
      ghost: [
        'text-foreground bg-transparent',
        'hover:bg-accent hover:text-primary',
        'active:bg-secondary',
      ],
      danger: [
        'bg-error text-white shadow-md',
        'hover:bg-red-600 hover:shadow-lg',
        'active:bg-red-700',
      ],
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[40px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]',
      xl: 'px-8 py-4 text-xl min-h-[56px]',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }