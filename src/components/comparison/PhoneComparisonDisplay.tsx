import React, { useState } from 'react'
import { Share2, TrendingUp, TrendingDown, Minus, ExternalLink, Bookmark, Plus } from 'lucide-react'
import { ComparisonResult, ComparisonCategory, SpecComparison } from '@/types/comparison'
import { Phone } from '@/types/phone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils'
import { PhoneCard } from './PhoneCard'
import { SpecificationChart } from './SpecificationChart'
import { CategoryComparison } from './CategoryComparison'
import { ComparisonInsights } from './ComparisonInsights'

interface PhoneComparisonDisplayProps {
  comparison: ComparisonResult
  onShare?: (comparison: ComparisonResult) => void
  onNewComparison?: () => void
  onModifySelection?: (phoneIndex: 0 | 1) => void
  onSaveComparison?: (comparison: ComparisonResult) => void
  onAddToComparison?: () => void
  showManagementActions?: boolean
  className?: string
}

export const PhoneComparisonDisplay: React.FC<PhoneComparisonDisplayProps> = ({
  comparison,
  onShare,
  onNewComparison,
  onModifySelection,
  onSaveComparison,
  onAddToComparison,
  showManagementActions = true,
  className,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('display')
  const [showInsights, setShowInsights] = useState(false)

  const { phones, categories, scores, overallWinner, insights, summary } = comparison

  const handleShare = async () => {
    if (onShare) {
      onShare(comparison)
    } else {
      // Default share functionality
      const shareData = {
        title: `${phones[0].brand} ${phones[0].model} vs ${phones[1].brand} ${phones[1].model}`,
        text: summary,
        url: window.location.href,
      }

      if (navigator.share && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData)
        } catch (error) {
          console.log('Share cancelled or failed:', error)
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href)
        // You could show a toast notification here
      }
    }
  }

  const getWinnerIndicator = (winner?: 'phone1' | 'phone2' | 'tie') => {
    switch (winner) {
      case 'phone1':
        return <TrendingUp className="w-4 h-4 text-success" />
      case 'phone2':
        return <TrendingDown className="w-4 h-4 text-error" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getOverallWinnerBadge = () => {
    if (overallWinner === 'tie') {
      return <Badge variant="secondary">Tie</Badge>
    }
    
    const winnerPhone = overallWinner === 'phone1' ? phones[0] : phones[1]
    return (
      <Badge variant="primary" className="animate-pulse-orange">
        Winner: {winnerPhone.brand} {winnerPhone.model}
      </Badge>
    )
  }

  return (
    <div className={cn('w-full max-w-7xl mx-auto space-y-6', className)}>
      {/* Header Section */}
      <Card variant="elevated" className="bg-gradient-to-r from-secondary to-accent">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl lg:text-3xl">
                Phone Comparison
              </CardTitle>
              <p className="text-foreground/70 mt-2">{summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getOverallWinnerBadge()}
              {showManagementActions && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    Share
                  </Button>
                  {onSaveComparison && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSaveComparison(comparison)}
                      leftIcon={<Bookmark className="w-4 h-4" />}
                    >
                      Save
                    </Button>
                  )}
                  {onAddToComparison && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddToComparison}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Phone
                    </Button>
                  )}
                  {onNewComparison && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onNewComparison}
                    >
                      New Comparison
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Phone Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhoneCard
          phone={phones[0]}
          score={scores.phone1}
          isWinner={overallWinner === 'phone1'}
          onModify={onModifySelection ? () => onModifySelection(0) : undefined}
        />
        <PhoneCard
          phone={phones[1]}
          score={scores.phone2}
          isWinner={overallWinner === 'phone2'}
          onModify={onModifySelection ? () => onModifySelection(1) : undefined}
        />
      </div>

      {/* Scores Chart */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Performance Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecificationChart
            phone1={phones[0]}
            phone2={phones[1]}
            scores1={scores.phone1}
            scores2={scores.phone2}
          />
        </CardContent>
      </Card>

      {/* Category Navigation */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={activeCategory === category.name ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(category.name)}
                className="relative"
              >
                {category.displayName}
                {category.winner && (
                  <span className="ml-2">
                    {getWinnerIndicator(category.winner)}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Category Comparison */}
      {categories.find(cat => cat.name === activeCategory) && (
        <CategoryComparison
          category={categories.find(cat => cat.name === activeCategory)!}
          phone1={phones[0]}
          phone2={phones[1]}
        />
      )}

      {/* Insights Section */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Comparison Insights</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
            >
              {showInsights ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>
        {showInsights && (
          <CardContent>
            <ComparisonInsights
              insights={insights}
              phone1={phones[0]}
              phone2={phones[1]}
            />
          </CardContent>
        )}
      </Card>

      {/* All Categories Overview */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Complete Specification Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.name} className="border-b border-border/30 pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {category.displayName}
                    {getWinnerIndicator(category.winner)}
                  </h3>
                  <Badge variant="outline" size="sm">
                    Weight: {Math.round(category.weight * 100)}%
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {category.comparisons.map((spec, index) => (
                    <SpecificationRow
                      key={index}
                      spec={spec}
                      phone1Name={`${phones[0].brand} ${phones[0].model}`}
                      phone2Name={`${phones[1].brand} ${phones[1].model}`}
                    />
                  ))}
                </div>
                {category.summary && (
                  <p className="text-sm text-foreground/70 mt-3 italic">
                    {category.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for individual specification rows
interface SpecificationRowProps {
  spec: SpecComparison
  phone1Name: string
  phone2Name: string
}

const SpecificationRow: React.FC<SpecificationRowProps> = ({
  spec,
  phone1Name,
  phone2Name,
}) => {
  const getValueDisplay = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (Array.isArray(value)) {
      return value.join(', ')
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center justify-between md:justify-start">
        <span className="font-medium text-sm">{spec.category}</span>
        {getImportanceBadge(spec.importance)}
      </div>
      
      <div className={cn(
        'flex items-center gap-2 p-2 rounded border',
        spec.winner === 'phone1' ? 'border-success bg-success/10' : 'border-border/50'
      )}>
        <span className="text-xs text-foreground/60 truncate">{phone1Name}:</span>
        <span className="font-medium text-sm">{getValueDisplay(spec.phone1Value)}</span>
        {spec.winner === 'phone1' && <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />}
      </div>
      
      <div className={cn(
        'flex items-center gap-2 p-2 rounded border',
        spec.winner === 'phone2' ? 'border-success bg-success/10' : 'border-border/50'
      )}>
        <span className="text-xs text-foreground/60 truncate">{phone2Name}:</span>
        <span className="font-medium text-sm">{getValueDisplay(spec.phone2Value)}</span>
        {spec.winner === 'phone2' && <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />}
      </div>
      
      <div className="flex items-center justify-center">
        {spec.winner === 'tie' ? (
          <Badge variant="secondary" size="sm">Tie</Badge>
        ) : (
          <div className="flex items-center gap-1">
            {spec.winner === 'phone1' ? (
              <Badge variant="success" size="sm">Phone 1</Badge>
            ) : (
              <Badge variant="success" size="sm">Phone 2</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PhoneComparisonDisplay