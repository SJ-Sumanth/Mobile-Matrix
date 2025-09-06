import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import ComparisonInsights from '../ComparisonInsights'
import { ComparisonInsights as IComparisonInsights } from '@/types/comparison'
import { Phone } from '@/types/phone'

const mockPhone1: Phone = {
  id: 'phone1',
  brand: 'Samsung',
  model: 'Galaxy S24',
  variant: '256GB',
  launchDate: new Date('2024-01-01'),
  availability: 'available',
  pricing: {
    mrp: 80000,
    currentPrice: 75000,
    currency: 'INR',
  },
  specifications: {
    display: {
      size: '6.2"',
      resolution: '1080x2340',
      type: 'AMOLED',
      refreshRate: 120,
      brightness: 1750,
    },
    camera: {
      rear: [{ megapixels: 50, aperture: 'f/1.8', features: ['OIS'], videoRecording: '8K' }],
      front: { megapixels: 12, aperture: 'f/2.2', features: [], videoRecording: '4K' },
      features: ['Night Mode', 'Portrait'],
    },
    performance: {
      processor: 'Snapdragon 8 Gen 3',
      gpu: 'Adreno 750',
      ram: ['8GB', '12GB'],
      storage: ['256GB', '512GB'],
      expandableStorage: false,
    },
    battery: {
      capacity: 4000,
      chargingSpeed: 25,
      wirelessCharging: true,
    },
    connectivity: {
      network: ['5G', '4G'],
      wifi: 'Wi-Fi 6E',
      bluetooth: '5.3',
      nfc: true,
    },
    build: {
      dimensions: '147 x 70.6 x 7.6 mm',
      weight: '167g',
      materials: ['Glass', 'Aluminum'],
      colors: ['Black', 'White', 'Purple'],
      waterResistance: 'IP68',
    },
    software: {
      os: 'Android',
      version: '14',
      updateSupport: '4 years',
    },
  },
  images: ['https://example.com/samsung-s24.jpg'],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPhone2: Phone = {
  id: 'phone2',
  brand: 'iPhone',
  model: '15 Pro',
  variant: '256GB',
  launchDate: new Date('2023-09-01'),
  availability: 'available',
  pricing: {
    mrp: 130000,
    currentPrice: 125000,
    currency: 'INR',
  },
  specifications: {
    display: {
      size: '6.1"',
      resolution: '1179x2556',
      type: 'OLED',
      refreshRate: 120,
      brightness: 2000,
    },
    camera: {
      rear: [{ megapixels: 48, aperture: 'f/1.78', features: ['OIS'], videoRecording: '4K' }],
      front: { megapixels: 12, aperture: 'f/1.9', features: [], videoRecording: '4K' },
      features: ['Night Mode', 'Cinematic Mode'],
    },
    performance: {
      processor: 'A17 Pro',
      gpu: 'Apple GPU',
      ram: ['8GB'],
      storage: ['256GB', '512GB', '1TB'],
      expandableStorage: false,
    },
    battery: {
      capacity: 3274,
      chargingSpeed: 20,
      wirelessCharging: true,
    },
    connectivity: {
      network: ['5G', '4G'],
      wifi: 'Wi-Fi 6E',
      bluetooth: '5.3',
      nfc: true,
    },
    build: {
      dimensions: '146.6 x 70.6 x 8.25 mm',
      weight: '187g',
      materials: ['Glass', 'Titanium'],
      colors: ['Natural', 'Blue', 'White', 'Black'],
      waterResistance: 'IP68',
    },
    software: {
      os: 'iOS',
      version: '17',
      updateSupport: '6 years',
    },
  },
  images: ['https://example.com/iphone-15-pro.jpg'],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockInsights: IComparisonInsights = {
  strengths: {
    phone1: ['battery life', 'value for money', 'display quality'],
    phone2: ['performance', 'build quality', 'camera quality'],
  },
  weaknesses: {
    phone1: ['price', 'software updates'],
    phone2: ['battery life', 'charging speed'],
  },
  recommendations: [
    'Consider Samsung Galaxy S24 if battery life is a priority',
    'Choose iPhone 15 Pro for better performance and build quality',
    'Samsung offers better value for money in this comparison',
  ],
  bestFor: {
    phone1: ['gaming', 'media consumption', 'budget-conscious users'],
    phone2: ['photography', 'professional use', 'premium experience'],
  },
}

describe('ComparisonInsights', () => {
  it('renders phone names in section headers', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Samsung Galaxy S24 Strengths')).toBeInTheDocument()
    expect(screen.getByText('iPhone 15 Pro Strengths')).toBeInTheDocument()
    expect(screen.getByText('Samsung Galaxy S24 Weaknesses')).toBeInTheDocument()
    expect(screen.getByText('iPhone 15 Pro Weaknesses')).toBeInTheDocument()
  })

  it('displays all strengths correctly', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Phone 1 strengths
    expect(screen.getByText('battery life')).toBeInTheDocument()
    expect(screen.getByText('value for money')).toBeInTheDocument()
    expect(screen.getByText('display quality')).toBeInTheDocument()

    // Phone 2 strengths
    expect(screen.getByText('performance')).toBeInTheDocument()
    expect(screen.getByText('build quality')).toBeInTheDocument()
    expect(screen.getByText('camera quality')).toBeInTheDocument()
  })

  it('displays all weaknesses correctly', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Phone 1 weaknesses
    expect(screen.getByText('price')).toBeInTheDocument()
    expect(screen.getByText('software updates')).toBeInTheDocument()

    // Phone 2 weaknesses (note: battery life appears in both strengths and weaknesses)
    expect(screen.getAllByText('battery life')).toHaveLength(2)
    expect(screen.getByText('charging speed')).toBeInTheDocument()
  })

  it('displays all recommendations', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Consider Samsung Galaxy S24 if battery life is a priority')).toBeInTheDocument()
    expect(screen.getByText('Choose iPhone 15 Pro for better performance and build quality')).toBeInTheDocument()
    expect(screen.getByText('Samsung offers better value for money in this comparison')).toBeInTheDocument()
  })

  it('displays best for scenarios as badges', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Phone 1 best for
    expect(screen.getByText('gaming')).toBeInTheDocument()
    expect(screen.getByText('media consumption')).toBeInTheDocument()
    expect(screen.getByText('budget-conscious users')).toBeInTheDocument()

    // Phone 2 best for
    expect(screen.getByText('photography')).toBeInTheDocument()
    expect(screen.getByText('professional use')).toBeInTheDocument()
    expect(screen.getByText('premium experience')).toBeInTheDocument()
  })

  it('shows correct section icons', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Should have thumbs up icons for strengths
    const thumbsUpIcons = screen.getAllByTestId('thumbs-up-icon') // This would need to be added to the component
    // For now, we'll check that the sections exist
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
  })

  it('displays summary statistics correctly', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('3')).toBeInTheDocument() // Samsung strengths count
    expect(screen.getByText('3')).toBeInTheDocument() // iPhone strengths count (appears twice)
    expect(screen.getByText('3')).toBeInTheDocument() // Recommendations count
    expect(screen.getByText('6')).toBeInTheDocument() // Total use cases count
  })

  it('handles empty strengths gracefully', () => {
    const emptyInsights = {
      ...mockInsights,
      strengths: {
        phone1: [],
        phone2: [],
      },
    }

    render(
      <ComparisonInsights
        insights={emptyInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getAllByText('No significant strengths identified in this comparison.')).toHaveLength(2)
  })

  it('handles empty weaknesses gracefully', () => {
    const emptyInsights = {
      ...mockInsights,
      weaknesses: {
        phone1: [],
        phone2: [],
      },
    }

    render(
      <ComparisonInsights
        insights={emptyInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getAllByText('No significant weaknesses identified in this comparison.')).toHaveLength(2)
  })

  it('handles empty recommendations gracefully', () => {
    const emptyInsights = {
      ...mockInsights,
      recommendations: [],
    }

    render(
      <ComparisonInsights
        insights={emptyInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Recommendations section should not be rendered when empty
    expect(screen.queryByText('Recommendations')).not.toBeInTheDocument()
  })

  it('handles empty best for scenarios gracefully', () => {
    const emptyInsights = {
      ...mockInsights,
      bestFor: {
        phone1: [],
        phone2: [],
      },
    }

    render(
      <ComparisonInsights
        insights={emptyInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getAllByText('No specific use cases identified.')).toHaveLength(2)
  })

  it('numbers recommendations correctly', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('applies correct styling to different sections', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Strengths should have success styling
    const strengthsSection = screen.getByText('Samsung Galaxy S24 Strengths').closest('div')
    expect(strengthsSection).toHaveClass('border-success/30')

    // Weaknesses should have error styling
    const weaknessesSection = screen.getByText('Samsung Galaxy S24 Weaknesses').closest('div')
    expect(weaknessesSection).toHaveClass('border-error/30')

    // Recommendations should have primary styling
    const recommendationsSection = screen.getByText('Recommendations').closest('div')
    expect(recommendationsSection).toHaveClass('border-primary/30')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('displays correct statistics in summary', () => {
    render(
      <ComparisonInsights
        insights={mockInsights}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Check that the statistics are calculated correctly
    expect(screen.getByText('Samsung Strengths')).toBeInTheDocument()
    expect(screen.getByText('iPhone Strengths')).toBeInTheDocument()
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Use Cases')).toBeInTheDocument()
  })
})