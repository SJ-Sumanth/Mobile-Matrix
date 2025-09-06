import React, { useState } from 'react'
import { Edit3, Calendar, DollarSign, Smartphone, Crown } from 'lucide-react'
import { Phone, PhoneScores } from '@/types/phone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils'

interface PhoneCardProps {
  phone: Phone
  score: PhoneScores
  isWinner?: boolean
  onModify?: () => void
  className?: string
}

export const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  score,
  isWinner = false,
  onModify,
  className,
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getAvailabilityBadge = (availability: string) => {
    const variants = {
      available: 'success',
      discontinued: 'error',
      upcoming: 'warning',
    } as const

    return (
      <Badge variant={variants[availability as keyof typeof variants] || 'secondary'} size="sm">
        {availability.charAt(0).toUpperCase() + availability.slice(1)}
      </Badge>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-error'
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const fallbackImage = (
    <div className="w-full h-48 bg-secondary/50 rounded-lg flex items-center justify-center">
      <Smartphone className="w-16 h-16 text-foreground/30" />
    </div>
  )

  return (
    <Card
      variant="elevated"
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        isWinner && 'ring-2 ring-primary shadow-orange-glow',
        className
      )}
      hover
    >
      {isWinner && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="primary" className="animate-pulse-orange">
            <Crown className="w-3 h-3 mr-1" />
            Winner
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              {phone.brand} {phone.model}
            </CardTitle>
            {phone.variant && (
              <p className="text-sm text-foreground/70 mt-1">{phone.variant}</p>
            )}
          </div>
          {onModify && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onModify}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Change
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Phone Image */}
        <div className="relative">
          {imageLoading && (
            <div className="w-full h-48 bg-secondary/50 rounded-lg animate-pulse" />
          )}
          {!imageError && phone.images.length > 0 ? (
            <img
              src={phone.images[0]}
              alt={`${phone.brand} ${phone.model}`}
              className={cn(
                'w-full h-48 object-contain rounded-lg bg-secondary/20',
                imageLoading && 'hidden'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            fallbackImage
          )}
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground/70">
                {phone.launchDate.toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-foreground/60" />
              <span className="font-medium text-primary">
                {formatPrice(phone.pricing.currentPrice)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-end">
              {getAvailabilityBadge(phone.availability)}
            </div>
            <div className="text-right">
              <span className="text-sm text-foreground/70">Overall Score</span>
              <div className={cn('text-2xl font-bold', getScoreColor(score.overall))}>
                {score.overall}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Specs */}
        <div className="space-y-3 pt-2 border-t border-border/30">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-foreground/60">Display:</span>
              <p className="font-medium truncate">{phone.specifications.display.size}</p>
            </div>
            <div>
              <span className="text-foreground/60">Processor:</span>
              <p className="font-medium truncate">{phone.specifications.performance.processor}</p>
            </div>
            <div>
              <span className="text-foreground/60">Camera:</span>
              <p className="font-medium">
                {phone.specifications.camera.rear[0]?.megapixels || 'N/A'}MP
              </p>
            </div>
            <div>
              <span className="text-foreground/60">Battery:</span>
              <p className="font-medium">{phone.specifications.battery.capacity}mAh</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <h4 className="text-sm font-medium text-foreground/80">Score Breakdown</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <ScoreItem label="Display" score={score.display} />
            <ScoreItem label="Camera" score={score.camera} />
            <ScoreItem label="Performance" score={score.performance} />
            <ScoreItem label="Battery" score={score.battery} />
            <ScoreItem label="Build" score={score.build} />
            <ScoreItem label="Value" score={score.value} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ScoreItemProps {
  label: string
  score: number
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-error'
  }

  return (
    <div className="text-center">
      <div className={cn('font-bold', getScoreColor(score))}>{score}</div>
      <div className="text-foreground/60 truncate">{label}</div>
    </div>
  )
}

export default PhoneCard