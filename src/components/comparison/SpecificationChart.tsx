import React, { useState } from 'react'
import { Phone, PhoneScores } from '@/types/phone'
import { cn } from '@/utils'

interface SpecificationChartProps {
  phone1: Phone
  phone2: Phone
  scores1: PhoneScores
  scores2: PhoneScores
  className?: string
}

export const SpecificationChart: React.FC<SpecificationChartProps> = ({
  phone1,
  phone2,
  scores1,
  scores2,
  className,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const categories = [
    { key: 'display', label: 'Display', icon: '📱' },
    { key: 'camera', label: 'Camera', icon: '📷' },
    { key: 'performance', label: 'Performance', icon: '⚡' },
    { key: 'battery', label: 'Battery', icon: '🔋' },
    { key: 'build', label: 'Build', icon: '🏗️' },
    { key: 'value', label: 'Value', icon: '💰' },
  ] as const

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success'
    if (score >= 60) return 'bg-warning'
    return 'bg-error'
  }

  const getScoreWidth = (score: number) => {
    return `${Math.max(5, score)}%`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            {phone1.brand} {phone1.model}
          </h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(scores1.overall / 100) * 314} 314`}
                className="text-primary transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{scores1.overall}</div>
                <div className="text-xs text-foreground/60">Overall</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            {phone2.brand} {phone2.model}
          </h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(scores2.overall / 100) * 314} 314`}
                className="text-primary transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{scores2.overall}</div>
                <div className="text-xs text-foreground/60">Overall</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Comparison Bars */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-center">Category Breakdown</h4>
        {categories.map((category) => {
          const score1 = scores1[category.key as keyof PhoneScores] as number
          const score2 = scores2[category.key as keyof PhoneScores] as number
          const isHovered = hoveredCategory === category.key

          return (
            <div
              key={category.key}
              className={cn(
                'p-4 rounded-lg border transition-all duration-200',
                isHovered ? 'border-primary bg-secondary/50' : 'border-border/30 bg-secondary/20'
              )}
              onMouseEnter={() => setHoveredCategory(category.key)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className={cn(
                    'font-bold',
                    score1 > score2 ? 'text-success' : score1 < score2 ? 'text-error' : 'text-foreground'
                  )}>
                    {score1}
                  </span>
                  <span className="text-foreground/40">vs</span>
                  <span className={cn(
                    'font-bold',
                    score2 > score1 ? 'text-success' : score2 < score1 ? 'text-error' : 'text-foreground'
                  )}>
                    {score2}
                  </span>
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div className="space-y-2">
                {/* Phone 1 Bar */}
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-right text-foreground/70 truncate">
                    {phone1.brand}
                  </div>
                  <div className="flex-1 bg-secondary rounded-full h-3 relative overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000 ease-out',
                        getScoreColor(score1),
                        isHovered && 'animate-pulse'
                      )}
                      style={{ width: getScoreWidth(score1) }}
                    />
                    {score1 > score2 && (
                      <div className="absolute right-1 top-0 h-full flex items-center">
                        <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                      </div>
                    )}
                  </div>
                  <div className="w-8 text-xs text-foreground/70">{score1}</div>
                </div>

                {/* Phone 2 Bar */}
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-right text-foreground/70 truncate">
                    {phone2.brand}
                  </div>
                  <div className="flex-1 bg-secondary rounded-full h-3 relative overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000 ease-out',
                        getScoreColor(score2),
                        isHovered && 'animate-pulse'
                      )}
                      style={{ width: getScoreWidth(score2) }}
                    />
                    {score2 > score1 && (
                      <div className="absolute right-1 top-0 h-full flex items-center">
                        <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                      </div>
                    )}
                  </div>
                  <div className="w-8 text-xs text-foreground/70">{score2}</div>
                </div>
              </div>

              {/* Difference Indicator */}
              <div className="mt-2 text-center">
                <div className="text-xs text-foreground/60">
                  {Math.abs(score1 - score2) === 0 ? (
                    'Tied'
                  ) : (
                    <>
                      {score1 > score2 ? phone1.brand : phone2.brand} leads by{' '}
                      <span className="font-medium text-primary">
                        {Math.abs(score1 - score2)} points
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Radar Chart Alternative (Simple Implementation) */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-center mb-4">Performance Radar</h4>
        <div className="relative w-full max-w-md mx-auto">
          <RadarChart
            categories={categories}
            scores1={scores1}
            scores2={scores2}
            phone1Name={phone1.brand}
            phone2Name={phone2.brand}
          />
        </div>
      </div>
    </div>
  )
}

interface RadarChartProps {
  categories: readonly { key: string; label: string; icon: string }[]
  scores1: PhoneScores
  scores2: PhoneScores
  phone1Name: string
  phone2Name: string
}

const RadarChart: React.FC<RadarChartProps> = ({
  categories,
  scores1,
  scores2,
  phone1Name,
  phone2Name,
}) => {
  const size = 200
  const center = size / 2
  const maxRadius = 80
  const levels = 5

  // Calculate points for each phone
  const getRadarPoints = (scores: PhoneScores) => {
    return categories.map((category, index) => {
      const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2
      const score = scores[category.key as keyof PhoneScores] as number
      const radius = (score / 100) * maxRadius
      const x = center + radius * Math.cos(angle)
      const y = center + radius * Math.sin(angle)
      return { x, y, score }
    })
  }

  const points1 = getRadarPoints(scores1)
  const points2 = getRadarPoints(scores2)

  const pathData1 = `M ${points1.map(p => `${p.x},${p.y}`).join(' L ')} Z`
  const pathData2 = `M ${points2.map(p => `${p.x},${p.y}`).join(' L ')} Z`

  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circles */}
        {Array.from({ length: levels }, (_, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(maxRadius * (i + 1)) / levels}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border/30"
          />
        ))}

        {/* Axis lines */}
        {categories.map((_, index) => {
          const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2
          const x = center + maxRadius * Math.cos(angle)
          const y = center + maxRadius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border/30"
            />
          )
        })}

        {/* Phone 1 area */}
        <path
          d={pathData1}
          fill="rgba(255, 107, 53, 0.2)"
          stroke="rgba(255, 107, 53, 0.8)"
          strokeWidth="2"
        />

        {/* Phone 2 area */}
        <path
          d={pathData2}
          fill="rgba(255, 140, 66, 0.2)"
          stroke="rgba(255, 140, 66, 0.8)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Data points */}
        {points1.map((point, index) => (
          <circle
            key={`p1-${index}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="rgb(255, 107, 53)"
            className="drop-shadow-sm"
          />
        ))}
        {points2.map((point, index) => (
          <circle
            key={`p2-${index}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="rgb(255, 140, 66)"
            className="drop-shadow-sm"
          />
        ))}
      </svg>

      {/* Category labels */}
      {categories.map((category, index) => {
        const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2
        const labelRadius = maxRadius + 20
        const x = center + labelRadius * Math.cos(angle)
        const y = center + labelRadius * Math.sin(angle)
        
        return (
          <div
            key={category.key}
            className="absolute text-xs font-medium text-center transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: x,
              top: y,
              width: '60px',
            }}
          >
            <div className="text-lg mb-1">{category.icon}</div>
            <div>{category.label}</div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-primary rounded" />
          <span>{phone1Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-primary-dark rounded border-2 border-dashed border-primary-dark" />
          <span>{phone2Name}</span>
        </div>
      </div>
    </div>
  )
}

export default SpecificationChart