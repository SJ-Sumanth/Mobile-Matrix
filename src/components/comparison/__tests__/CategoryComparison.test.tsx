import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import CategoryComparison from '../CategoryComparison'
import { ComparisonCategory } from '@/types/comparison'
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

const mockCategory: ComparisonCategory = {
  name: 'display',
  displayName: 'Display',
  weight: 0.2,
  comparisons: [
    {
      category: 'Screen Size',
      phone1Value: '6.2"',
      phone2Value: '6.1"',
      winner: 'phone1',
      importance: 'high',
    },
    {
      category: 'Resolution',
      phone1Value: '1080x2340',
      phone2Value: '1179x2556',
      winner: 'phone2',
      importance: 'high',
    },
    {
      category: 'Display Type',
      phone1Value: 'AMOLED',
      phone2Value: 'OLED',
      winner: 'tie',
      importance: 'medium',
      difference: 'Both are excellent display technologies',
    },
    {
      category: 'Refresh Rate',
      phone1Value: '120Hz',
      phone2Value: '120Hz',
      winner: 'tie',
      importance: 'low',
    },
  ],
  winner: 'phone1',
  summary: 'Samsung has a slightly larger display but iPhone has higher resolution',
}

describe('CategoryComparison', () => {
  it('renders category information correctly', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Display')).toBeInTheDocument()
    expect(screen.getByText('Weight: 20% of overall score')).toBeInTheDocument()
  })

  it('displays category icon', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('📱')).toBeInTheDocument()
  })

  it('shows winner badge correctly', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Winner: Samsung Galaxy S24')).toBeInTheDocument()
  })

  it('shows tie badge when category is tied', () => {
    const tiedCategory = { ...mockCategory, winner: 'tie' as const }
    render(
      <CategoryComparison
        category={tiedCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Tie')).toBeInTheDocument()
  })

  it('displays category summary when available', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText(mockCategory.summary!)).toBeInTheDocument()
  })

  it('renders all specification comparisons', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Screen Size')).toBeInTheDocument()
    expect(screen.getByText('Resolution')).toBeInTheDocument()
    expect(screen.getByText('Display Type')).toBeInTheDocument()
    expect(screen.getByText('Refresh Rate')).toBeInTheDocument()
  })

  it('displays specification values correctly', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('6.2"')).toBeInTheDocument()
    expect(screen.getByText('6.1"')).toBeInTheDocument()
    expect(screen.getByText('1080x2340')).toBeInTheDocument()
    expect(screen.getByText('1179x2556')).toBeInTheDocument()
  })

  it('shows importance badges correctly', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getAllByText('High Priority')).toHaveLength(2)
    expect(screen.getByText('Medium Priority')).toBeInTheDocument()
    expect(screen.getByText('Low Priority')).toBeInTheDocument()
  })

  it('highlights winning specifications', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Should show Samsung as winner for screen size
    const screenSizeRow = screen.getByText('Screen Size').closest('div')
    const samsungValue = screenSizeRow?.querySelector('[class*="border-success"]')
    expect(samsungValue).toBeInTheDocument()
  })

  it('shows tie indicators for tied specifications', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Should show tie badges for tied specifications
    const tieBadges = screen.getAllByText('Tie')
    expect(tieBadges.length).toBeGreaterThan(0)
  })

  it('displays phone names in specification rows', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getAllByText('Samsung Galaxy S24')).toHaveLength(4) // One for each spec
    expect(screen.getAllByText('iPhone 15 Pro')).toHaveLength(4) // One for each spec
  })

  it('shows additional difference information when available', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Both are excellent display technologies')).toBeInTheDocument()
  })

  it('handles boolean values correctly', () => {
    const categoryWithBoolean: ComparisonCategory = {
      ...mockCategory,
      comparisons: [
        {
          category: 'Wireless Charging',
          phone1Value: true,
          phone2Value: false,
          winner: 'phone1',
          importance: 'medium',
        },
      ],
    }

    render(
      <CategoryComparison
        category={categoryWithBoolean}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('handles array values correctly', () => {
    const categoryWithArray: ComparisonCategory = {
      ...mockCategory,
      comparisons: [
        {
          category: 'RAM Options',
          phone1Value: ['8GB', '12GB'],
          phone2Value: ['8GB'],
          winner: 'phone1',
          importance: 'high',
        },
      ],
    }

    render(
      <CategoryComparison
        category={categoryWithArray}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('8GB, 12GB')).toBeInTheDocument()
    expect(screen.getByText('8GB')).toBeInTheDocument()
  })

  it('handles number values correctly', () => {
    const categoryWithNumber: ComparisonCategory = {
      ...mockCategory,
      comparisons: [
        {
          category: 'Battery Capacity',
          phone1Value: 4000,
          phone2Value: 3274,
          winner: 'phone1',
          importance: 'high',
        },
      ],
    }

    render(
      <CategoryComparison
        category={categoryWithNumber}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    expect(screen.getByText('4,000')).toBeInTheDocument()
    expect(screen.getByText('3,274')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies hover effects to specification rows', () => {
    render(
      <CategoryComparison
        category={mockCategory}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    const specRow = screen.getByText('Screen Size').closest('div')
    expect(specRow).toHaveClass('hover:border-primary/30')
  })

  it('handles category without summary', () => {
    const categoryWithoutSummary = { ...mockCategory, summary: undefined }
    render(
      <CategoryComparison
        category={categoryWithoutSummary}
        phone1={mockPhone1}
        phone2={mockPhone2}
      />
    )

    // Should render without errors
    expect(screen.getByText('Display')).toBeInTheDocument()
  })
})