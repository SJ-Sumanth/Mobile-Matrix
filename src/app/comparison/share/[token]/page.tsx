import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ComparisonService } from '@/lib/services/comparison.service';
import PhoneComparisonDisplay from '@/components/comparison/PhoneComparisonDisplay';
import MultiPhoneComparisonDisplay from '@/components/comparison/MultiPhoneComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Share2, ExternalLink } from 'lucide-react';

interface SharedComparisonPageProps {
  params: {
    token: string;
  };
}

// Generate metadata for shared comparison
export async function generateMetadata({ params }: SharedComparisonPageProps): Promise<Metadata> {
  try {
    const comparisonService = new ComparisonService();
    const comparison = await comparisonService.getComparisonByShareToken(params.token);
    
    const phoneNames = [
      `${comparison.phone1.brand.name} ${comparison.phone1.model}`,
      `${comparison.phone2.brand.name} ${comparison.phone2.model}`,
    ];
    
    const title = `${phoneNames.join(' vs ')} - Phone Comparison | MobileMatrix`;
    const description = `Compare ${phoneNames.join(' and ')} specifications, features, and performance. Find the best phone for your needs.`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: [
          {
            url: '/api/og/comparison/' + params.token,
            width: 1200,
            height: 630,
            alt: `${phoneNames.join(' vs ')} comparison`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/api/og/comparison/' + params.token],
      },
    };
  } catch (error) {
    return {
      title: 'Phone Comparison | MobileMatrix',
      description: 'Compare phone specifications and features',
    };
  }
}

export default async function SharedComparisonPage({ params }: SharedComparisonPageProps) {
  try {
    const comparisonService = new ComparisonService();
    const dbComparison = await comparisonService.getComparisonByShareToken(params.token);
    
    if (!dbComparison) {
      notFound();
    }

    // Convert database comparison to frontend format
    const comparison = {
      id: dbComparison.id,
      phones: [
        {
          id: dbComparison.phone1.id,
          brand: dbComparison.phone1.brand.name,
          model: dbComparison.phone1.model,
          variant: dbComparison.phone1.variant,
          launchDate: dbComparison.phone1.launchDate,
          availability: dbComparison.phone1.availability,
          pricing: {
            mrp: dbComparison.phone1.mrp || 0,
            currentPrice: dbComparison.phone1.currentPrice || 0,
            currency: dbComparison.phone1.currency,
          },
          specifications: dbComparison.phone1.specifications || {},
          images: dbComparison.phone1.images,
        },
        {
          id: dbComparison.phone2.id,
          brand: dbComparison.phone2.brand.name,
          model: dbComparison.phone2.model,
          variant: dbComparison.phone2.variant,
          launchDate: dbComparison.phone2.launchDate,
          availability: dbComparison.phone2.availability,
          pricing: {
            mrp: dbComparison.phone2.mrp || 0,
            currentPrice: dbComparison.phone2.currentPrice || 0,
            currency: dbComparison.phone2.currency,
          },
          specifications: dbComparison.phone2.specifications || {},
          images: dbComparison.phone2.images,
        },
      ],
      categories: dbComparison.result?.categories || [],
      scores: dbComparison.result?.scores || { phone1: {}, phone2: {} },
      overallWinner: dbComparison.overallWinner,
      insights: dbComparison.result?.insights || { strengths: { phone1: [], phone2: [] }, weaknesses: { phone1: [], phone2: [] }, recommendations: [], bestFor: { phone1: [], phone2: [] } },
      summary: dbComparison.result?.summary || 'Phone comparison',
      generatedAt: dbComparison.createdAt,
    };

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${comparison.phones[0].brand} ${comparison.phones[0].model} vs ${comparison.phones[1].brand} ${comparison.phones[1].model}`,
            text: comparison.summary,
            url: window.location.href,
          });
        } catch (error) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(window.location.href);
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Shared comparison header */}
          <Card variant="elevated" className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Shared Comparison</Badge>
                    <Badge variant="outline">
                      {new Date(comparison.generatedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">
                    {comparison.phones[0].brand} {comparison.phones[0].model} vs {comparison.phones[1].brand} {comparison.phones[1].model}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    Share
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    asChild
                  >
                    <a href="/" className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Start New Comparison
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Comparison display */}
          <PhoneComparisonDisplay
            comparison={comparison}
            onShare={handleShare}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading shared comparison:', error);
    notFound();
  }
}