import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhoneComparison } from '../comparison/PhoneComparison';
import { ComparisonResult } from '../../types/comparison';
import { Phone } from '../../types/phone';

const mockPhone1: Phone = {
  id: '1',
  brand: 'Apple',
  model: 'iPhone 15',
  launchDate: new Date('2023-09-15'),
  availability: 'available',
  pricing: { mrp: 79900, currentPrice: 79900, currency: 'INR' },
  specifications: {
    display: { size: '6.1"', resolution: '2556x1179', type: 'Super Retina XDR' },
    camera: {
      rear: [{ megapixels: 48, aperture: 'f/1.6', features: ['Night mode'] }],
      front: { megapixels: 12, aperture: 'f/1.9', features: [] },
      features: ['Photographic Styles']
    },
    performance: { processor: 'A16 Bionic', ram: ['6GB'], storage: ['128GB', '256GB', '512GB'] },
    battery: { capacity: 3349, chargingSpeed: 20 },
    connectivity: { network: ['5G'], wifi: 'Wi-Fi 6', bluetooth: '5.3' },
    build: { dimensions: '147.6 x 71.6 x 7.8 mm', weight: '171g', materials: ['Aluminum', 'Glass'], colors: ['Black', 'Blue'] },
    software: { os: 'iOS', version: '17' }
  },
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPhone2: Phone = {
  ...mockPhone1,
  id: '2',
  brand: 'Samsung',
  model: 'Galaxy S24',
  pricing: { mrp: 74999, currentPrice: 74999, currency: 'INR' },
  specifications: {
    ...mockPhone1.specifications,
    performance: { processor: 'Snapdragon 8 Gen 3', ram: ['8GB'], storage: ['128GB', '256GB'] },
    software: { os: 'Android', version: '14' }
  }
};

const mockComparison: ComparisonResult = {
  phones: [mockPhone1, mockPhone2],
  categories: [
    {
      name: 'Display',
      phone1Score: 8.5,
      phone2Score: 8.0,
      winner: 'phone1',
      details: 'Both phones have excellent displays'
    },
    {
      name: 'Camera',
      phone1Score: 9.0,
      phone2Score: 8.5,
      winner: 'phone1',
      details: 'iPhone has better video recording'
    }
  ],
  insights: ['iPhone 15 excels in camera performance', 'Samsung offers better value for money'],
  recommendations: ['Choose iPhone for iOS ecosystem', 'Choose Samsung for customization'],
  generatedAt: new Date(),
};

describe('PhoneComparison Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders phone comparison with both phones', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S24')).toBeInTheDocument();
  });

  it('displays phone specifications', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('A16 Bionic')).toBeInTheDocument();
    expect(screen.getByText('Snapdragon 8 Gen 3')).toBeInTheDocument();
    expect(screen.getByText('6.1"')).toBeInTheDocument();
  });

  it('shows pricing information', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('₹79,900')).toBeInTheDocument();
    expect(screen.getByText('₹74,999')).toBeInTheDocument();
  });

  it('displays comparison categories with scores', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('8.0')).toBeInTheDocument();
  });

  it('highlights category winners', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    const displaySection = screen.getByText('Display').closest('[data-testid="category"]');
    expect(displaySection).toHaveClass('winner-phone1');
  });

  it('shows insights and recommendations', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('iPhone 15 excels in camera performance')).toBeInTheDocument();
    expect(screen.getByText('Choose iPhone for iOS ecosystem')).toBeInTheDocument();
  });

  it('displays availability status', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getAllByText('Available')).toHaveLength(2);
  });

  it('shows launch dates', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('Sep 2023')).toBeInTheDocument();
  });

  it('renders responsive layout', () => {
    const { container } = render(<PhoneComparison comparison={mockComparison} />);
    
    const comparisonGrid = container.querySelector('[data-testid="comparison-grid"]');
    expect(comparisonGrid).toHaveClass('grid', 'md:grid-cols-2');
  });

  it('handles missing phone images gracefully', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    const phoneImages = screen.getAllByAltText(/phone/i);
    expect(phoneImages).toHaveLength(2);
  });

  it('displays software information', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('iOS 17')).toBeInTheDocument();
    expect(screen.getByText('Android 14')).toBeInTheDocument();
  });

  it('shows battery specifications', () => {
    render(<PhoneComparison comparison={mockComparison} />);
    
    expect(screen.getByText('3349 mAh')).toBeInTheDocument();
    expect(screen.getByText('20W')).toBeInTheDocument();
  });
});