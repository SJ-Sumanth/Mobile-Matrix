import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PhoneComparisonDisplay from '../PhoneComparisonDisplay'
import { ComparisonResult } from '@/types/comparison'
import { Phone } from '@/types/phone'

// Mock the child components
vi.mock('../PhoneCard', () => ({
  default: ({ phone, score, isWinner, onModify }: any) => (
    <div data-testid={`phone-card-${phone.id}`}>
      <span>{phone.brand} {phone.model}</span>
      <span>Score: {score.overall}</span>
      {isWinner && <span>Winner</span>}
      {onModify && <button onClick={onModify}>Modify</button>}
    </div>
  ),
}))

vi.mock('../SpecificationChart', () => ({
  default: ({ phone1, phone2, scores1, scores2 }: any) => (
    <div data-testid="specification-chart">
      <span>{phone1.brand} vs {phone2.brand}</span>
      <span>Scores: {scores1.overall} vs {scores2.overall}</span>
    </div>
  ),
}))

vi.mock('../CategoryComparison', () => ({
  default: ({ category, phone1, phone2 }: any) => (
    <div data-testid={`category-comparison-${category.name}`}>
      <span>{category.displayName}</span>
      <span>{phone1.brand} vs {phone2.brand}</span>
    </div>
  ),
}))

vi.mock('../ComparisonInsights', () => ({
  default: ({ insights, phone1, phone2 }: any) => (
    <div data-testid="comparison-insights">
      <span>Insights for {phone1.brand} vs {phone2.brand}</span>
      <span>Recommendations: {insights.recommendations.length}</span>
    </div>
  ),
}))

// Mock navigator.share and clipboard
Object.assign(navigator, {
  share: vi.fn(),
  canShare: vi.fn(),
  clipboard: {
    writeText: vi.fn(),
  },
})

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

const mockComparison: ComparisonResult = {
  id: 'comparison1',
  phones: [mockPhone1, mockPhone2],
  categories: [
    {
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
      ],
      winner: 'phone1',
      summary: 'Samsung has a slightly larger display',
    },
    {
      name: 'camera',
      displayName: 'Camera',
      weight: 0.25,
      comparisons: [
        {
          category: 'Main Camera',
          phone1Value: '50MP',
          phone2Value: '48MP',
          winner: 'phone1',
          importance: 'high',
        },
      ],
      winner: 'phone1',
      summary: 'Samsung has higher megapixel count',
    },
  ],
  scores: {
    phone1: {
      overall: 85,
      display: 88,
      camera: 82,
      performance: 90,
      battery: 80,
      build: 85,
      value: 75,
    },
    phone2: {
      overall: 88,
      display: 85,
      camera: 85,
      performance: 95,
      battery: 75,
      build: 90,
      value: 70,
    },
  },
  overallWinner: 'phone2',
  insights: {
    strengths: {
      phone1: ['battery life', 'value for money'],
      phone2: ['performance', 'build quality'],
    },
    weaknesses: {
      phone1: ['price'],
      phone2: ['battery life'],
    },
    recommendations: ['Consider iPhone for performance', 'Consider Samsung for battery'],
    bestFor: {
      phone1: ['gaming', 'media consumption'],
      phone2: ['photography', 'professional use'],
    },
  },
  summary: 'iPhone 15 Pro edges out with better overall performance',
  generatedAt: new Date(),
}

describe('PhoneComparisonDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders comparison display with phone information', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    expect(screen.getByText('Phone Comparison')).toBeInTheDocument()
    expect(screen.getByText(mockComparison.summary)).toBeInTheDocument()
    expect(screen.getByTestId('phone-card-phone1')).toBeInTheDocument()
    expect(screen.getByTestId('phone-card-phone2')).toBeInTheDocument()
  })

  it('displays winner badge correctly', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    expect(screen.getByText('Winner: iPhone 15 Pro')).toBeInTheDocument()
  })

  it('displays tie badge when comparison is tied', () => {
    const tiedComparison = {
      ...mockComparison,
      overallWinner: 'tie' as const,
    }

    render(<PhoneComparisonDisplay comparison={tiedComparison} />)

    expect(screen.getByText('Tie')).toBeInTheDocument()
  })

  it('renders specification chart', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    expect(screen.getByTestId('specification-chart')).toBeInTheDocument()
    expect(screen.getByText('Samsung vs iPhone')).toBeInTheDocument()
  })

  it('renders category navigation buttons', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    expect(screen.getByText('Display')).toBeInTheDocument()
    expect(screen.getByText('Camera')).toBeInTheDocument()
  })

  it('switches active category when navigation button is clicked', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    // Initially display category should be active
    expect(screen.getByTestId('category-comparison-display')).toBeInTheDocument()

    // Click on camera category
    fireEvent.click(screen.getByText('Camera'))

    // Camera category should now be displayed
    expect(screen.getByTestId('category-comparison-camera')).toBeInTheDocument()
  })

  it('toggles insights visibility', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    const showDetailsButton = screen.getByText('Show Details')
    expect(showDetailsButton).toBeInTheDocument()

    // Initially insights should be hidden
    expect(screen.queryByTestId('comparison-insights')).not.toBeInTheDocument()

    // Click to show insights
    fireEvent.click(showDetailsButton)

    // Insights should now be visible
    expect(screen.getByTestId('comparison-insights')).toBeInTheDocument()
    expect(screen.getByText('Hide Details')).toBeInTheDocument()
  })

  it('calls onShare when share button is clicked', async () => {
    const mockOnShare = vi.fn()
    render(<PhoneComparisonDisplay comparison={mockComparison} onShare={mockOnShare} />)

    const shareButton = screen.getByText('Share')
    fireEvent.click(shareButton)

    expect(mockOnShare).toHaveBeenCalledWith(mockComparison)
  })

  it('uses native share API when available and no onShare provided', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined)
    const mockCanShare = vi.fn().mockReturnValue(true)
    
    Object.assign(navigator, {
      share: mockShare,
      canShare: mockCanShare,
    })

    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    const shareButton = screen.getByText('Share')
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Samsung Galaxy S24 vs iPhone 15 Pro',
        text: mockComparison.summary,
        url: window.location.href,
      })
    })
  })

  it('falls back to clipboard when native share is not available', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    
    Object.assign(navigator, {
      share: undefined,
      canShare: undefined,
      clipboard: { writeText: mockWriteText },
    })

    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    const shareButton = screen.getByText('Share')
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(window.location.href)
    })
  })

  it('calls onNewComparison when new comparison button is clicked', () => {
    const mockOnNewComparison = vi.fn()
    render(
      <PhoneComparisonDisplay 
        comparison={mockComparison} 
        onNewComparison={mockOnNewComparison} 
      />
    )

    const newComparisonButton = screen.getByText('New Comparison')
    fireEvent.click(newComparisonButton)

    expect(mockOnNewComparison).toHaveBeenCalled()
  })

  it('calls onModifySelection when modify button is clicked', () => {
    const mockOnModifySelection = vi.fn()
    render(
      <PhoneComparisonDisplay 
        comparison={mockComparison} 
        onModifySelection={mockOnModifySelection} 
      />
    )

    const modifyButtons = screen.getAllByText('Modify')
    fireEvent.click(modifyButtons[0])

    expect(mockOnModifySelection).toHaveBeenCalledWith(0)
  })

  it('renders complete specification comparison', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    expect(screen.getByText('Complete Specification Comparison')).toBeInTheDocument()
    expect(screen.getByText('Screen Size')).toBeInTheDocument()
    expect(screen.getByText('Main Camera')).toBeInTheDocument()
  })

  it('displays specification values correctly', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    expect(screen.getByText('6.2"')).toBeInTheDocument()
    expect(screen.getByText('6.1"')).toBeInTheDocument()
    expect(screen.getByText('50MP')).toBeInTheDocument()
    expect(screen.getByText('48MP')).toBeInTheDocument()
  })

  it('shows winner indicators for specifications', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    // Should show winner badges for specifications
    const winnerBadges = screen.getAllByText('Phone 1')
    expect(winnerBadges.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(
      <PhoneComparisonDisplay comparison={mockComparison} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles missing optional props gracefully', () => {
    render(<PhoneComparisonDisplay comparison={mockComparison} />)

    // Should render without errors even without optional props
    expect(screen.getByText('Phone Comparison')).toBeInTheDocument()
  })
})