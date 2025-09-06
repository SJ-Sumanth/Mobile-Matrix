import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneSelector } from '../PhoneSelector';
import { usePhoneSelection } from '@/hooks/usePhoneSelection';
import { Brand, Phone, PhoneSelection } from '@/types/phone';

// Mock the usePhoneSelection hook
vi.mock('@/hooks/usePhoneSelection', () => ({
  usePhoneSelection: vi.fn(),
}));

const mockUsePhoneSelection = usePhoneSelection as any;

// Mock data
const mockBrands: Brand[] = [
  { id: '1', name: 'Samsung', logo: 'samsung-logo.png' },
  { id: '2', name: 'Apple', logo: 'apple-logo.png' },
];

const mockModels = ['Galaxy S24', 'Galaxy S23', 'Galaxy Note 20'];

const mockSuggestions: Phone[] = [
  {
    id: '1',
    brand: 'Samsung',
    model: 'Galaxy S24',
    variant: '256GB',
    launchDate: new Date('2024-01-01'),
    availability: 'available',
    pricing: { mrp: 80000, currentPrice: 75000, currency: 'INR' },
    specifications: {
      display: { size: '6.2"', resolution: '2340x1080', type: 'AMOLED' },
      camera: { rear: [{ megapixels: 50, features: [] }], front: { megapixels: 12, features: [] }, features: [] },
      performance: { processor: 'Snapdragon 8 Gen 3', ram: ['8GB'], storage: ['256GB'] },
      battery: { capacity: 4000 },
      connectivity: { network: ['5G'], wifi: 'Wi-Fi 6', bluetooth: '5.3' },
      build: { dimensions: '147x70.6x7.6mm', weight: '167g', materials: ['Glass'], colors: ['Black'] },
      software: { os: 'Android', version: '14' },
    },
    images: ['image1.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockHookReturn = {
  brands: [],
  models: [],
  suggestions: [],
  isLoading: false,
  error: null,
  searchBrands: vi.fn(),
  searchModels: vi.fn(),
  getSuggestions: vi.fn(),
  validateSelection: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
};

describe('PhoneSelector', () => {
  const mockOnSelectionComplete = vi.fn();
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePhoneSelection.mockReturnValue(mockHookReturn);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render brand and model inputs', () => {
    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    expect(screen.getByLabelText('Phone Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Model')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select Phone' })).toBeInTheDocument();
  });

  it('should disable model input when no brand is selected', () => {
    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    const modelInput = screen.getByLabelText('Phone Model');
    expect(modelInput).toBeDisabled();
    expect(modelInput).toHaveAttribute('placeholder', 'Select a brand first');
  });

  it('should enable model input when brand is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    const brandInput = screen.getByLabelText('Phone Brand');
    await user.type(brandInput, 'Samsung');

    const modelInput = screen.getByLabelText('Phone Model');
    expect(modelInput).not.toBeDisabled();
    expect(modelInput).toHaveAttribute('placeholder', 'Search for a Samsung model');
  });

  it('should call searchBrands when typing in brand input', async () => {
    const user = userEvent.setup();
    
    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    const brandInput = screen.getByLabelText('Phone Brand');
    await user.type(brandInput, 'Sam');

    // Wait for debounce
    await waitFor(() => {
      expect(mockHookReturn.searchBrands).toHaveBeenCalledWith('Sam');
    }, { timeout: 500 });
  });

  it('should display brand suggestions when available', () => {
    mockUsePhoneSelection.mockReturnValue({
      ...mockHookReturn,
      brands: mockBrands,
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Focus the brand input to show suggestions
    const brandInput = screen.getByLabelText('Phone Brand');
    fireEvent.focus(brandInput);
    fireEvent.change(brandInput, { target: { value: 'Sam' } });

    expect(screen.getByText('Samsung')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('should select brand from suggestions', async () => {
    const user = userEvent.setup();
    mockUsePhoneSelection.mockReturnValue({
      ...mockHookReturn,
      brands: mockBrands,
    });

    render(
      <PhoneSelector 
        onSelectionComplete={mockOnSelectionComplete}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const brandInput = screen.getByLabelText('Phone Brand');
    await user.type(brandInput, 'Sam');
    
    // Click on Samsung suggestion
    const samsungOption = screen.getByText('Samsung');
    await user.click(samsungOption);

    expect(brandInput).toHaveValue('Samsung');
    expect(mockOnSelectionChange).toHaveBeenCalledWith({
      brand: 'Samsung',
      model: '',
      variant: '',
    });
  });

  it('should call searchModels when typing in model input', async () => {
    const user = userEvent.setup();
    
    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // First select a brand
    const brandInput = screen.getByLabelText('Phone Brand');
    await user.type(brandInput, 'Samsung');

    // Then type in model input
    const modelInput = screen.getByLabelText('Phone Model');
    await user.type(modelInput, 'Galaxy');

    // Wait for debounce
    await waitFor(() => {
      expect(mockHookReturn.searchModels).toHaveBeenCalledWith('Galaxy', 'Samsung');
    }, { timeout: 500 });
  });

  it('should display model suggestions when available', () => {
    mockUsePhoneSelection.mockReturnValue({
      ...mockHookReturn,
      models: mockModels,
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Set brand first
    const brandInput = screen.getByLabelText('Phone Brand');
    fireEvent.change(brandInput, { target: { value: 'Samsung' } });

    // Focus model input to show suggestions
    const modelInput = screen.getByLabelText('Phone Model');
    fireEvent.focus(modelInput);
    fireEvent.change(modelInput, { target: { value: 'Galaxy' } });

    expect(screen.getByText('Galaxy S24')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S23')).toBeInTheDocument();
    expect(screen.getByText('Galaxy Note 20')).toBeInTheDocument();
  });

  it('should validate selection when Select Phone button is clicked', async () => {
    const user = userEvent.setup();
    mockHookReturn.validateSelection.mockResolvedValue({
      isValid: true,
      errors: [],
      suggestions: [],
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Fill in brand and model
    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');
    
    await user.type(brandInput, 'Samsung');
    await user.type(modelInput, 'Galaxy S24');

    // Click Select Phone button
    const selectButton = screen.getByRole('button', { name: 'Select Phone' });
    await user.click(selectButton);

    expect(mockHookReturn.validateSelection).toHaveBeenCalledWith({
      brand: 'Samsung',
      model: 'Galaxy S24',
      variant: undefined,
    });
  });

  it('should call onSelectionComplete when validation succeeds', async () => {
    const user = userEvent.setup();
    mockHookReturn.validateSelection.mockResolvedValue({
      isValid: true,
      errors: [],
      suggestions: [],
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Fill in brand and model
    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');
    
    await user.type(brandInput, 'Samsung');
    await user.type(modelInput, 'Galaxy S24');

    // Click Select Phone button
    const selectButton = screen.getByRole('button', { name: 'Select Phone' });
    await user.click(selectButton);

    await waitFor(() => {
      expect(mockOnSelectionComplete).toHaveBeenCalledWith({
        brand: 'Samsung',
        model: 'Galaxy S24',
        variant: undefined,
      });
    });
  });

  it('should display validation errors when validation fails', async () => {
    const user = userEvent.setup();
    mockHookReturn.validateSelection.mockResolvedValue({
      isValid: false,
      errors: ['Phone not found in database'],
      suggestions: [],
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Fill in brand and model
    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');
    
    await user.type(brandInput, 'Samsung');
    await user.type(modelInput, 'Galaxy S25');

    // Click Select Phone button
    const selectButton = screen.getByRole('button', { name: 'Select Phone' });
    await user.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('• Phone not found in database')).toBeInTheDocument();
    });
  });

  it('should display suggestions when validation fails with suggestions', async () => {
    const user = userEvent.setup();
    mockHookReturn.validateSelection.mockResolvedValue({
      isValid: false,
      errors: ['Phone not found in database'],
      suggestions: mockSuggestions,
    });
    mockUsePhoneSelection.mockReturnValue({
      ...mockHookReturn,
      suggestions: mockSuggestions,
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Fill in brand and model
    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');
    
    await user.type(brandInput, 'Samsung');
    await user.type(modelInput, 'Galaxy S25');

    // Click Select Phone button
    const selectButton = screen.getByRole('button', { name: 'Select Phone' });
    await user.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('Did you mean one of these?')).toBeInTheDocument();
      expect(screen.getByText('Samsung Galaxy S24 256GB')).toBeInTheDocument();
    });
  });

  it('should clear inputs when Clear button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    // Fill in brand and model
    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');
    
    await user.type(brandInput, 'Samsung');
    await user.type(modelInput, 'Galaxy S24');

    // Clear button should appear
    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearButton);

    expect(brandInput).toHaveValue('');
    expect(modelInput).toHaveValue('');
  });

  it('should display loading state during validation', async () => {
    const user = userEvent.setup();
    mockUsePhoneSelection.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Validating/ })).toBeDisabled();
  });

  it('should display error message when there is an error', () => {
    mockUsePhoneSelection.mockReturnValue({
      ...mockHookReturn,
      error: 'Network error occurred',
    });

    render(
      <PhoneSelector onSelectionComplete={mockOnSelectionComplete} />
    );

    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <PhoneSelector 
        onSelectionComplete={mockOnSelectionComplete}
        disabled={true}
      />
    );

    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');
    const selectButton = screen.getByRole('button', { name: 'Select Phone' });

    expect(brandInput).toBeDisabled();
    expect(modelInput).toBeDisabled();
    expect(selectButton).toBeDisabled();
  });

  it('should initialize with initial selection', () => {
    const initialSelection: Partial<PhoneSelection> = {
      brand: 'Samsung',
      model: 'Galaxy S24',
    };

    render(
      <PhoneSelector 
        onSelectionComplete={mockOnSelectionComplete}
        initialSelection={initialSelection}
      />
    );

    const brandInput = screen.getByLabelText('Phone Brand');
    const modelInput = screen.getByLabelText('Phone Model');

    expect(brandInput).toHaveValue('Samsung');
    expect(modelInput).toHaveValue('Galaxy S24');
  });
});