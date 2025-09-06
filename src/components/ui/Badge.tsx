import React from 'react'
import { cn } from '@/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', rounded = false, ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2',
      rounded ? 'rounded-full' : 'rounded-md',
    ]

    const variants = {
      default: 'bg-secondary text-foreground border border-border',
      primary: 'bg-primary text-white shadow-sm',
      secondary: 'bg-accent text-foreground',
      success: 'bg-success text-white',
      warning: 'bg-warning text-white',
      error: 'bg-error text-white',
      outline: 'border-2 border-primary text-primary bg-transparent',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }