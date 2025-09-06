import React from 'react'
import { ThumbsUp, ThumbsDown, Lightbulb, Target } from 'lucide-react'
import { ComparisonInsights as IComparisonInsights } from '@/types/comparison'
import { Phone } from '@/types/phone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils'

interface ComparisonInsightsProps {
  insights: IComparisonInsights
  phone1: Phone
  phone2: Phone
  className?: string
}

export const ComparisonInsights: React.FC<ComparisonInsightsProps> = ({
  insights,
  phone1,
  phone2,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Strengths Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="outlined" className="border-success/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <ThumbsUp className="w-5 h-5" />
              {phone1.brand} {phone1.model} Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.strengths.phone1.length > 0 ? (
              <div className="space-y-2">
                {insights.strengths.phone1.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-success/10 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
                    <span className="text-sm capitalize">{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 italic">
                No significant strengths identified in this comparison.
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" className="border-success/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <ThumbsUp className="w-5 h-5" />
              {phone2.brand} {phone2.model} Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.strengths.phone2.length > 0 ? (
              <div className="space-y-2">
                {insights.strengths.phone2.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-success/10 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
                    <span className="text-sm capitalize">{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 italic">
                No significant strengths identified in this comparison.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weaknesses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="outlined" className="border-error/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <ThumbsDown className="w-5 h-5" />
              {phone1.brand} {phone1.model} Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.weaknesses.phone1.length > 0 ? (
              <div className="space-y-2">
                {insights.weaknesses.phone1.map((weakness, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-error/10 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-error rounded-full flex-shrink-0" />
                    <span className="text-sm capitalize">{weakness}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 italic">
                No significant weaknesses identified in this comparison.
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" className="border-error/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <ThumbsDown className="w-5 h-5" />
              {phone2.brand} {phone2.model} Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.weaknesses.phone2.length > 0 ? (
              <div className="space-y-2">
                {insights.weaknesses.phone2.map((weakness, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-error/10 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-error rounded-full flex-shrink-0" />
                    <span className="text-sm capitalize">{weakness}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 italic">
                No significant weaknesses identified in this comparison.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Section */}
      {insights.recommendations.length > 0 && (
        <Card variant="outlined" className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg"
                >
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best For Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="outlined" className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Target className="w-5 h-5" />
              {phone1.brand} {phone1.model} Best For
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.bestFor.phone1.length > 0 ? (
              <div className="space-y-2">
                {insights.bestFor.phone1.map((scenario, index) => (
                  <Badge
                    key={index}
                    variant="warning"
                    className="mr-2 mb-2 inline-flex"
                  >
                    {scenario}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 italic">
                No specific use cases identified.
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Target className="w-5 h-5" />
              {phone2.brand} {phone2.model} Best For
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.bestFor.phone2.length > 0 ? (
              <div className="space-y-2">
                {insights.bestFor.phone2.map((scenario, index) => (
                  <Badge
                    key={index}
                    variant="warning"
                    className="mr-2 mb-2 inline-flex"
                  >
                    {scenario}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 italic">
                No specific use cases identified.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card variant="glass" className="bg-gradient-to-r from-secondary/50 to-accent/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {insights.strengths.phone1.length}
              </div>
              <div className="text-xs text-foreground/60">
                {phone1.brand} Strengths
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {insights.strengths.phone2.length}
              </div>
              <div className="text-xs text-foreground/60">
                {phone2.brand} Strengths
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {insights.recommendations.length}
              </div>
              <div className="text-xs text-foreground/60">
                Recommendations
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {insights.bestFor.phone1.length + insights.bestFor.phone2.length}
              </div>
              <div className="text-xs text-foreground/60">
                Use Cases
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ComparisonInsights