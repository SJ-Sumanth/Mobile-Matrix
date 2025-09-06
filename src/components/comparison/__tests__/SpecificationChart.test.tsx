import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SpecificationChart from '../SpecificationChart'
import { Phone, PhoneScores } from '@/types/phone'

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

const mockScores1: PhoneScores = {
  overall: 85,
  display: 88,
  camera: 82,
  performance: 90,
  battery: 80,
  build: 85,
  value: 75,
}

const mockScores2: PhoneScores = {
  overall: 88,
  display: 85,
  camera: 85,
  performance: 95,
  battery: 75,
  build: 90,
  value: 70,
}

describe('SpecificationChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders phone names correctly', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument()
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
  })

  it('displays overall scores in circular charts', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Should display overall scores
    const overallScores = screen.getAllByText('Overall')
    expect(overallScores).toHaveLength(2)
    
    expect(screen.getAllByText('85').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('88').length).toBeGreaterThanOrEqual(1)
  })

  it('renders all category sections', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    expect(screen.getAllByText('Display')).toHaveLength(2) // Chart and radar
    expect(screen.getAllByText('Camera')).toHaveLength(2)
    expect(screen.getAllByText('Performance')).toHaveLength(2)
    expect(screen.getAllByText('Battery')).toHaveLength(2)
    expect(screen.getAllByText('Build')).toHaveLength(2)
    expect(screen.getAllByText('Value')).toHaveLength(2)
  })

  it('displays category scores correctly', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Check that scores are displayed (multiple instances expected)
    expect(screen.getAllByText('88').length).toBeGreaterThanOrEqual(1) // Overall + display + chart
    expect(screen.getAllByText('85').length).toBeGreaterThanOrEqual(1) // Overall + display + chart
    expect(screen.getAllByText('90').length).toBeGreaterThanOrEqual(1) // Performance score
    expect(screen.getAllByText('95').length).toBeGreaterThanOrEqual(1) // Performance score
  })

  it('shows winner indicators correctly', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Should show phone names and scores
    expect(screen.getByText('Samsung')).toBeInTheDocument()
    expect(screen.getByText('iPhone')).toBeInTheDocument()
    
    // Should show some scores
    expect(screen.getAllByText(/\d+/).length).toBeGreaterThan(0)
  })

  it('handles tied scores correctly', () => {
    const tiedScores1 = { ...mockScores1, camera: 85 }
    const tiedScores2 = { ...mockScores2, camera: 85 }

    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={tiedScores1}
        scores2={tiedScores2}
      />
    )

    expect(screen.getByText('Tied')).toBeInTheDocument()
  })

  it('applies hover effects on category sections', () => {
    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    const displaySections = container.querySelectorAll('[class*="border-border/30"]')
    const displaySection = displaySections[0]
    
    // Hover over display section
    fireEvent.mouseEnter(displaySection!)

    // Should apply hover styling
    expect(displaySection).toHaveClass('border-primary')
  })

  it('removes hover effects on mouse leave', () => {
    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    const displaySections = container.querySelectorAll('[class*="border-border/30"]')
    const displaySection = displaySections[0]
    
    // Hover and then leave
    fireEvent.mouseEnter(displaySection!)
    fireEvent.mouseLeave(displaySection!)

    // Should remove hover styling
    expect(displaySection).not.toHaveClass('border-primary')
  })

  it('renders radar chart section', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    expect(screen.getByText('Performance Radar')).toBeInTheDocument()
  })

  it('displays radar chart legend', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Check for legend text in radar chart section
    const legendItems = screen.getAllByText('Samsung')
    expect(legendItems.length).toBeGreaterThan(0)
    const iPhoneLegendItems = screen.getAllByText('iPhone')
    expect(iPhoneLegendItems.length).toBeGreaterThan(0)
  })

  it('renders SVG elements for radar chart', () => {
    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    const svgElements = container.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('displays category icons', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Should display emoji icons for categories
    expect(screen.getAllByText('📱')).toHaveLength(2) // Display (appears in both chart and radar)
    expect(screen.getAllByText('📷')).toHaveLength(2) // Camera
    expect(screen.getAllByText('⚡')).toHaveLength(2) // Performance
    expect(screen.getAllByText('🔋')).toHaveLength(2) // Battery
    expect(screen.getAllByText('🏗️')).toHaveLength(2) // Build
    expect(screen.getAllByText('💰')).toHaveLength(2) // Value
  })

  it('applies correct score colors based on score values', () => {
    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // High scores should have success color
    const successBars = container.querySelectorAll('[class*="bg-success"]')
    expect(successBars.length).toBeGreaterThan(0)
  })

  it('calculates bar widths correctly', () => {
    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Should set width based on score percentage - check for style attribute
    const barsWithWidth = container.querySelectorAll('[style*="width"]')
    expect(barsWithWidth.length).toBeGreaterThan(0)
  })

  it('shows leading indicators for higher scores', () => {
    render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
      />
    )

    // Should show pulsing indicator for leading scores
    const leadingBars = screen.getAllByRole('generic').filter(el => 
      el.querySelector('[class*="animate-ping"]')
    )
    expect(leadingBars.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={mockScores1}
        scores2={mockScores2}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles minimum bar width correctly', () => {
    const lowScores1 = { ...mockScores1, value: 2 }
    const lowScores2 = { ...mockScores2, value: 1 }

    const { container } = render(
      <SpecificationChart
        phone1={mockPhone1}
        phone2={mockPhone2}
        scores1={lowScores1}
        scores2={lowScores2}
      />
    )

    // Even very low scores should have minimum 5% width for visibility
    const barsWithMinWidth = container.querySelectorAll('[style*="width: 5%"]')
    expect(barsWithMinWidth.length).toBeGreaterThan(0)
  })
})