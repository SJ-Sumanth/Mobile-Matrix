import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PhoneCard from '../PhoneCard'
import { Phone, PhoneScores } from '@/types/phone'

const mockPhone: Phone = {
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

const mockScores: PhoneScores = {
  overall: 85,
  display: 88,
  camera: 82,
  performance: 90,
  battery: 80,
  build: 85,
  value: 75,
}

describe('PhoneCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders phone information correctly', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument()
    expect(screen.getByText('256GB')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument() // Overall score
  })

  it('displays winner badge when isWinner is true', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} isWinner={true} />)

    expect(screen.getByText('Winner')).toBeInTheDocument()
  })

  it('does not display winner badge when isWinner is false', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} isWinner={false} />)

    expect(screen.queryByText('Winner')).not.toBeInTheDocument()
  })

  it('formats price correctly', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.getByText('₹75,000')).toBeInTheDocument()
  })

  it('displays availability badge with correct variant', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('displays availability badge for discontinued phone', () => {
    const discontinuedPhone = { ...mockPhone, availability: 'discontinued' as const }
    render(<PhoneCard phone={discontinuedPhone} score={mockScores} />)

    expect(screen.getByText('Discontinued')).toBeInTheDocument()
  })

  it('displays availability badge for upcoming phone', () => {
    const upcomingPhone = { ...mockPhone, availability: 'upcoming' as const }
    render(<PhoneCard phone={upcomingPhone} score={mockScores} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('displays launch date correctly', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.getByText('Jan 2024')).toBeInTheDocument()
  })

  it('displays quick specs correctly', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.getByText('6.2"')).toBeInTheDocument()
    expect(screen.getByText('Snapdragon 8 Gen 3')).toBeInTheDocument()
    expect(screen.getByText('50MP')).toBeInTheDocument()
    expect(screen.getByText('4000mAh')).toBeInTheDocument()
  })

  it('displays score breakdown correctly', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.getByText('88')).toBeInTheDocument() // Display score
    expect(screen.getByText('82')).toBeInTheDocument() // Camera score
    expect(screen.getByText('90')).toBeInTheDocument() // Performance score
    expect(screen.getByText('80')).toBeInTheDocument() // Battery score
    expect(screen.getByText('85')).toBeInTheDocument() // Build score
    expect(screen.getByText('75')).toBeInTheDocument() // Value score
  })

  it('calls onModify when modify button is clicked', () => {
    const mockOnModify = vi.fn()
    render(<PhoneCard phone={mockPhone} score={mockScores} onModify={mockOnModify} />)

    const modifyButton = screen.getByText('Change')
    fireEvent.click(modifyButton)

    expect(mockOnModify).toHaveBeenCalled()
  })

  it('does not render modify button when onModify is not provided', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    expect(screen.queryByText('Change')).not.toBeInTheDocument()
  })

  it('displays phone image when available', () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    const image = screen.getByAltText('Samsung Galaxy S24')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/samsung-s24.jpg')
  })

  it('shows fallback when image fails to load', async () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    const image = screen.getByAltText('Samsung Galaxy S24')
    
    // Simulate image load error
    fireEvent.error(image)

    await waitFor(() => {
      expect(screen.queryByAltText('Samsung Galaxy S24')).not.toBeInTheDocument()
    })
  })

  it('shows fallback when no images are available', () => {
    const phoneWithoutImages = { ...mockPhone, images: [] }
    render(<PhoneCard phone={phoneWithoutImages} score={mockScores} />)

    // Should show fallback icon instead of image
    expect(screen.queryByAltText('Samsung Galaxy S24')).not.toBeInTheDocument()
  })

  it('handles phone without variant', () => {
    const phoneWithoutVariant = { ...mockPhone, variant: undefined }
    render(<PhoneCard phone={phoneWithoutVariant} score={mockScores} />)

    expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument()
    expect(screen.queryByText('256GB')).not.toBeInTheDocument()
  })

  it('handles phone without rear camera', () => {
    const phoneWithoutCamera = {
      ...mockPhone,
      specifications: {
        ...mockPhone.specifications,
        camera: {
          ...mockPhone.specifications.camera,
          rear: [],
        },
      },
    }
    render(<PhoneCard phone={phoneWithoutCamera} score={mockScores} />)

    expect(screen.getByText('N/AMP')).toBeInTheDocument()
  })

  it('applies winner styling when isWinner is true', () => {
    const { container } = render(
      <PhoneCard phone={mockPhone} score={mockScores} isWinner={true} />
    )

    const card = container.querySelector('[class*="ring-2"]')
    expect(card).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <PhoneCard phone={mockPhone} score={mockScores} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('displays correct score colors based on score value', () => {
    const highScorePhone = { ...mockScores, overall: 90 }
    render(<PhoneCard phone={mockPhone} score={highScorePhone} />)

    // High score should have success color class
    const overallScore = screen.getByText('90')
    expect(overallScore).toHaveClass('text-success')
  })

  it('displays medium score with warning color', () => {
    const mediumScorePhone = { ...mockScores, overall: 65 }
    render(<PhoneCard phone={mockPhone} score={mediumScorePhone} />)

    const overallScore = screen.getByText('65')
    expect(overallScore).toHaveClass('text-warning')
  })

  it('displays low score with error color', () => {
    const lowScorePhone = { ...mockScores, overall: 45 }
    render(<PhoneCard phone={mockPhone} score={lowScorePhone} />)

    const overallScore = screen.getByText('45')
    expect(overallScore).toHaveClass('text-error')
  })

  it('handles image loading states correctly', async () => {
    render(<PhoneCard phone={mockPhone} score={mockScores} />)

    // Initially should show loading skeleton
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('hidden')

    const image = screen.getByAltText('Samsung Galaxy S24')
    
    // Simulate image load
    fireEvent.load(image)

    await waitFor(() => {
      expect(image).not.toHaveClass('hidden')
    })
  })
})