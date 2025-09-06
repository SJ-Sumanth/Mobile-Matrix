import React from 'react'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { ComparisonCategory, SpecComparison } from '@/types/comparison'
import { Phone } from '@/types/phone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils'

interface CategoryComparisonProps {
  category: ComparisonCategory
  phone1: Phone
  phone2: Phone
  className?: string
}

export const CategoryComparison: React.FC<CategoryComparisonProps> = ({
  category,
  phone1,
  phone2,
  className,
}) => {
  const getWinnerIcon = (winner?: 'phone1' | 'phone2' | 'tie') => {
    switch (winner) {
      case 'phone1':
        return <TrendingUp className="w-4 h-4 text-success" />
      case 'phone2':
        return <TrendingDown className="w-4 h-4 text-error" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getImportanceBadge = (importance: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'error',
      medium: 'warning',
      low: 'secondary',
    } as const

    const labels = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority',
    }

    return (
      <Badge variant={variants[importance]} size="sm">
        {labels[importance]}
      </Badge>
    )
  }

  const formatValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return String(value)
  }

  const getCategoryIcon = (categoryName: string) => {
    const icons = {
      display: '📱',
      camera: '📷',
      performance: '⚡',
      battery: '🔋',
      build: '🏗️',
      value: '💰',
    } as const

    return icons[categoryName as keyof typeof icons] || '📋'
  }

  const getWinnerBadge = (winner?: 'phone1' | 'phone2' | 'tie') => {
    if (winner === 'tie') {
      return <Badge variant="secondary">Tie</Badge>
    }
    
    const winnerPhone = winner === 'phone1' ? phone1 : phone2
    return (
      <Badge variant="primary">
        Winner: {winnerPhone?.brand} {winnerPhone?.model}
      </Badge>
    )
  }

  return (
    <Card variant="elevated" className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">{getCategoryIcon(category.name)}</span>
            <div>
              <div className="flex items-center gap-2">
                {category.displayName}
                {getWinnerIcon(category.winner)}
              </div>
              <div className="text-sm text-foreground/60 font-normal">
                Weight: {Math.round(category.weight * 100)}% of overall score
              </div>
            </div>
          </CardTitle>
          {getWinnerBadge(category.winner)}
        </div>
        {category.summary && (
          <div className="flex items-start gap-2 p-3 bg-secondary/30 rounded-lg mt-4">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/80">{category.summary}</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {category.comparisons.map((spec, index) => (
            <SpecificationComparisonRow
              key={index}
              spec={spec}
              phone1={phone1}
              phone2={phone2}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface SpecificationComparisonRowProps {
  spec: SpecComparison
  phone1: Phone
  phone2: Phone
}

const SpecificationComparisonRow: React.FC<SpecificationComparisonRowProps> = ({
  spec,
  phone1,
  phone2,
}) => {
  const formatValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return String(value)
  }

  const getImportanceBadge = (importance: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'error',
      medium: 'warning',
      low: 'secondary',
    } as const

    return (
      <Badge variant={variants[importance]} size="sm">
        {importance}
      </Badge>
    )
  }

  const getComparisonResult = () => {
    if (spec.winner === 'tie') {
      return (
        <div className="flex items-center justify-center">
          <Badge variant="secondary" size="sm">
            <Minus className="w-3 h-3 mr-1" />
            Tie
          </Badge>
        </div>
      )
    }

    const winnerPhone = spec.winner === 'phone1' ? phone1 : phone2
    const isPhone1Winner = spec.winner === 'phone1'

    return (
      <div className="flex items-center justify-center">
        <Badge variant="success" size="sm">
          <TrendingUp className="w-3 h-3 mr-1" />
          {winnerPhone.brand}
        </Badge>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-secondary/20 transition-all duration-200">
      {/* Specification Name & Importance */}
      <div className="lg:col-span-1 space-y-2">
        <div className="font-medium text-sm">{spec.category}</div>
        {getImportanceBadge(spec.importance)}
      </div>

      {/* Phone 1 Value */}
      <div className={cn(
        'lg:col-span-1 p-3 rounded-lg border transition-all duration-200',
        spec.winner === 'phone1' 
          ? 'border-success bg-success/10 shadow-sm' 
          : 'border-border/50 bg-secondary/20'
      )}>
        <div className="text-xs text-foreground/60 mb-1">
          {phone1.brand} {phone1.model}
        </div>
        <div className="font-medium text-sm flex items-center gap-2">
          {formatValue(spec.phone1Value)}
          {spec.winner === 'phone1' && (
            <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />
          )}
        </div>
      </div>

      {/* VS Divider */}
      <div className="lg:col-span-1 flex items-center justify-center">
        <div className="text-foreground/40 font-medium text-sm">VS</div>
      </div>

      {/* Phone 2 Value */}
      <div className={cn(
        'lg:col-span-1 p-3 rounded-lg border transition-all duration-200',
        spec.winner === 'phone2' 
          ? 'border-success bg-success/10 shadow-sm' 
          : 'border-border/50 bg-secondary/20'
      )}>
        <div className="text-xs text-foreground/60 mb-1">
          {phone2.brand} {phone2.model}
        </div>
        <div className="font-medium text-sm flex items-center gap-2">
          {formatValue(spec.phone2Value)}
          {spec.winner === 'phone2' && (
            <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Winner */}
      <div className="lg:col-span-1">
        {getComparisonResult()}
      </div>

      {/* Difference/Additional Info */}
      {spec.difference && (
        <div className="lg:col-span-5 mt-2 p-2 bg-accent/20 rounded text-xs text-foreground/70 italic">
          <strong>Note:</strong> {spec.difference}
        </div>
      )}
    </div>
  )
}

export default CategoryComparison