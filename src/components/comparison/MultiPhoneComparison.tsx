import React, { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MultiPhoneComparison, ComparisonCategory } from '@/types/comparison';
import { Phone } from '@/types/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

interface MultiPhoneComparisonProps {
  comparison: MultiPhoneComparison;
  onShare?: (comparison: MultiPhoneComparison) => void;
  onNewComparison?: () => void;
  onModifySelection?: (phoneIndex: number) => void;
  className?: string;
}

export const MultiPhoneComparisonDisplay: React.FC<MultiPhoneComparisonProps> = ({
  comparison,
  onShare,
  onNewComparison,
  onModifySelection,
  className,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('display');
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  const { phones, categories, scores, rankings, insights, summary } = comparison;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return 'success';
      case 2:
        return 'warning';
      case 3:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className={cn('w-full max-w-7xl mx-auto space-y-6', className)}>
      {/* Header Section */}
      <Card variant="elevated" className="bg-gradient-to-r from-secondary to-accent">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl lg:text-3xl">
                Multi-Phone Comparison
              </CardTitle>
              <p className="text-foreground/70 mt-2">{summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare?.(comparison)}
              >
                Share Comparison
              </Button>
              {onNewComparison && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onNewComparison}
                >
                  New Comparison
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rankings Overview */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Overall Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankings.map((ranking) => {
              const phone = phones.find(p => p.id === ranking.phoneId);
              if (!phone) return null;

              return (
                <div
                  key={ranking.phoneId}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all',
                    ranking.rank === 1 
                      ? 'border-success bg-success/10' 
                      : 'border-border bg-secondary/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(ranking.rank)}
                      <Badge variant={getRankBadgeVariant(ranking.rank)} size="sm">
                        Rank {ranking.rank}
                      </Badge>
                    </div>
                    {onModifySelection && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onModifySelection(phones.indexOf(phone))}
                      >
                        Change
                      </Button>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg">
                    {phone.brand} {phone.model}
                  </h3>
                  <p className="text-sm text-foreground/60 mb-2">
                    {phone.variant || 'Base variant'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60">Total Score</span>
                    <span className="font-bold text-lg">
                      {Math.round(ranking.totalScore * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>      {/*
 Category Navigation */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={activeCategory === category.name ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(category.name)}
              >
                {category.displayName}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Category Comparison */}
      {categories.find(cat => cat.name === activeCategory) && (
        <MultiCategoryComparison
          category={categories.find(cat => cat.name === activeCategory)!}
          phones={phones}
          scores={scores}
        />
      )}

      {/* Detailed Specifications Table */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detailed Specifications</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllSpecs(!showAllSpecs)}
            >
              {showAllSpecs ? 'Hide' : 'Show'} All Specs
            </Button>
          </div>
        </CardHeader>
        {showAllSpecs && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold">Specification</th>
                    {phones.map((phone) => (
                      <th key={phone.id} className="text-center p-3 font-semibold min-w-[150px]">
                        {phone.brand} {phone.model}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) =>
                    category.comparisons.map((spec, index) => (
                      <tr key={`${category.name}-${index}`} className="border-b border-border/30">
                        <td className="p-3 font-medium">{spec.category}</td>
                        {phones.map((phone) => (
                          <td key={phone.id} className="p-3 text-center">
                            {/* This would need to be implemented based on the spec structure */}
                            <span className="text-sm">-</span>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Insights Section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Comparison Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {insights.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Best For</h4>
              <div className="space-y-3">
                {Object.entries(insights.bestFor).map(([phoneKey, uses]) => {
                  const phone = phones.find(p => p.id === phoneKey);
                  if (!phone || !uses.length) return null;
                  
                  return (
                    <div key={phoneKey}>
                      <h5 className="text-sm font-medium text-foreground/80">
                        {phone.brand} {phone.model}
                      </h5>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uses.map((use, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Multi-Category Comparison Component
interface MultiCategoryComparisonProps {
  category: ComparisonCategory;
  phones: Phone[];
  scores: Record<string, any>;
}

const MultiCategoryComparison: React.FC<MultiCategoryComparisonProps> = ({
  category,
  phones,
  scores,
}) => {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>{category.displayName} Comparison</CardTitle>
        {category.summary && (
          <p className="text-sm text-foreground/70">{category.summary}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phones.map((phone) => {
            const phoneScore = scores[phone.id];
            return (
              <div
                key={phone.id}
                className="p-4 border border-border rounded-lg bg-secondary/20"
              >
                <h4 className="font-medium mb-2">
                  {phone.brand} {phone.model}
                </h4>
                {phoneScore && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/60">Category Score</span>
                      <span className="font-semibold">
                        {Math.round((phoneScore[category.name] || 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(phoneScore[category.name] || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiPhoneComparisonDisplay;