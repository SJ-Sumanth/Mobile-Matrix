import React from 'react'
import { cn } from '@/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outlined'
  inputSize?: 'sm' | 'md' | 'lg'
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  helperText?: string
  errorText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      variant = 'default',
      inputSize = 'md',
      error = false,
      leftIcon,
      rightIcon,
      label,
      helperText,
      errorText,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'w-full rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-foreground/50',
    ]

    const variants = {
      default: [
        'bg-secondary border border-border text-foreground',
        'hover:border-primary/50',
        'focus:border-primary focus:bg-secondary/80',
        error && 'border-error focus:border-error focus:ring-error/50',
      ].filter(Boolean),
      filled: [
        'bg-accent border-0 text-foreground',
        'hover:bg-accent/80',
        'focus:bg-gray-800 focus:ring-orange-500/50',
        error && 'bg-error/10 focus:ring-error/50',
      ].filter(Boolean),
      outlined: [
        'bg-transparent border-2 border-border text-foreground',
        'hover:border-primary/50',
        'focus:border-primary',
        error && 'border-error focus:border-error focus:ring-error/50',
      ].filter(Boolean),
    }

    const sizes = {
      sm: leftIcon || rightIcon ? 'py-2 px-3 text-sm' : 'py-2 px-3 text-sm',
      md: leftIcon || rightIcon ? 'py-2.5 px-4 text-base' : 'py-2.5 px-4 text-base',
      lg: leftIcon || rightIcon ? 'py-3 px-5 text-lg' : 'py-3 px-5 text-lg',
    }

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    }

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50',
            iconSizes[inputSize]
          )}>
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            baseStyles,
            variants[variant],
            sizes[inputSize],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50',
            iconSizes[inputSize]
          )}>
            {rightIcon}
          </div>
        )}
      </div>
    )

    if (label || helperText || errorText) {
      const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
      
      const inputElementWithId = (
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50',
              iconSizes[inputSize]
            )}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              ...baseStyles,
              ...variants[variant],
              sizes[inputSize],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50',
              iconSizes[inputSize]
            )}>
              {rightIcon}
            </div>
          )}
        </div>
      );

      return (
        <div className="space-y-2">
          {label && (
            <label 
              htmlFor={inputId}
              className={cn(
                'block text-sm font-medium text-foreground',
                error && 'text-error',
                disabled && 'opacity-50'
              )}
            >
              {label}
            </label>
          )}
          {inputElementWithId}
          {(helperText || errorText) && (
            <p className={cn(
              'text-xs',
              error ? 'text-error' : 'text-foreground/60'
            )}>
              {error ? errorText : helperText}
            </p>
          )}
        </div>
      )
    }

    return inputElement
  }
)

Input.displayName = 'Input'

export { Input }