import React from 'react'
import { cn } from '@/utils'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'current'
  thickness?: 'thin' | 'medium' | 'thick'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', thickness = 'medium', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    }

    const colors = {
      primary: 'border-primary',
      secondary: 'border-secondary',
      white: 'border-white',
      current: 'border-current',
    }

    const thicknesses = {
      thin: 'border',
      medium: 'border-2',
      thick: 'border-4',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-t-transparent',
          sizes[size],
          colors[color],
          thicknesses[thickness],
          className
        )}
        {...props}
      />
    )
  }
)

Spinner.displayName = 'Spinner'

const LoadingSpinner: React.FC<{
  size?: SpinnerProps['size']
  text?: string
  className?: string
}> = ({ size = 'md', text, className }) => (
  <div className={cn('flex items-center justify-center gap-3', className)}>
    <Spinner size={size} />
    {text && <span className="text-foreground/70">{text}</span>}
  </div>
)

export { Spinner, LoadingSpinner }