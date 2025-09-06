import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhoneSelection } from '../usePhoneSelection';
import { phoneSelectionService } from '@/services/phoneSelection';
import { Brand, Phone } from '@/types/phone';

// Mock the phone selection service
vi.mock('@/services/phoneSelection', () => ({
  phoneSelectionService: {
    searchBrands: vi.fn(),
    searchModels: vi.fn(),
    getSimilarPhones: vi.fn(),
    validateSelection: vi.fn(),
  },
}));

const mockPhoneSelectionService = phoneSelectionService as any;

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

describe('usePhoneSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => usePhoneSelection());

    expect(result.current.brands).toEqual([]);
    expect(result.current.models).toEqual([]);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('searchBrands', () => {
    it('should search brands successfully', async () => {
      mockPhoneSelectionService.searchBrands.mockResolvedValue(mockBrands);

      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.searchBrands('Sam');
      });

      expect(result.current.brands).toEqual(mockBrands);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockPhoneSelectionService.searchBrands).toHaveBeenCalledWith('Sam');
    });

    it('should handle search brands error', async () => {
      const errorMessage = 'Failed to search brands';
      mockPhoneSelectionService.searchBrands.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.searchBrands('Sam');
      });

      expect(result.current.brands).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should not search with query less than 2 characters', async () => {
      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.searchBrands('S');
      });

      expect(result.current.brands).toEqual([]);
      expect(mockPhoneSelectionService.searchBrands).not.toHaveBeenCalled();
    });

    it('should set loading state during search', async () => {
      let resolvePromise: (value: Brand[]) => void;
      const promise = new Promise<Brand[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockPhoneSelectionService.searchBrands.mockReturnValue(promise);

      const { result } = renderHook(() => usePhoneSelection());

      act(() => {
        result.current.searchBrands('Samsung');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(mockBrands);
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('searchModels', () => {
    it('should search models successfully', async () => {
      mockPhoneSelectionService.searchModels.mockResolvedValue(mockModels);

      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.searchModels('Galaxy', 'Samsung');
      });

      expect(result.current.models).toEqual(mockModels);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockPhoneSelectionService.searchModels).toHaveBeenCalledWith('Galaxy', 'Samsung');
    });

    it('should handle search models error', async () => {
      const errorMessage = 'Failed to search models';
      mockPhoneSelectionService.searchModels.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.searchModels('Galaxy', 'Samsung');
      });

      expect(result.current.models).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should not search with empty parameters', async () => {
      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.searchModels('', 'Samsung');
      });

      expect(result.current.models).toEqual([]);
      expect(mockPhoneSelectionService.searchModels).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.searchModels('Galaxy', '');
      });

      expect(result.current.models).toEqual([]);
      expect(mockPhoneSelectionService.searchModels).not.toHaveBeenCalled();
    });
  });

  describe('getSuggestions', () => {
    it('should get suggestions successfully', async () => {
      mockPhoneSelectionService.getSimilarPhones.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.getSuggestions('Samsung', 'Galaxy S24');
      });

      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockPhoneSelectionService.getSimilarPhones).toHaveBeenCalledWith('Samsung', 'Galaxy S24');
    });

    it('should handle get suggestions error', async () => {
      const errorMessage = 'Failed to get suggestions';
      mockPhoneSelectionService.getSimilarPhones.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhoneSelection());

      await act(async () => {
        await result.current.getSuggestions('Samsung', 'Galaxy S24');
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('validateSelection', () => {
    it('should validate selection successfully', async () => {
      const validationResult = {
        isValid: true,
        errors: [],
        suggestions: [],
      };
      mockPhoneSelectionService.validateSelection.mockResolvedValue(validationResult);

      const { result } = renderHook(() => usePhoneSelection());

      let validationResponse;
      await act(async () => {
        validationResponse = await result.current.validateSelection({
          brand: 'Samsung',
          model: 'Galaxy S24',
        });
      });

      expect(validationResponse).toEqual(validationResult);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle validation with suggestions', async () => {
      const validationResult = {
        isValid: false,
        errors: ['Phone not found'],
        suggestions: mockSuggestions,
      };
      mockPhoneSelectionService.validateSelection.mockResolvedValue(validationResult);

      const { result } = renderHook(() => usePhoneSelection());

      let validationResponse;
      await act(async () => {
        validationResponse = await result.current.validateSelection({
          brand: 'Samsung',
          model: 'Galaxy S25',
        });
      });

      expect(validationResponse).toEqual(validationResult);
      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle validation error', async () => {
      const errorMessage = 'Validation failed';
      mockPhoneSelectionService.validateSelection.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhoneSelection());

      let validationResponse;
      await act(async () => {
        validationResponse = await result.current.validateSelection({
          brand: 'Samsung',
          model: 'Galaxy S24',
        });
      });

      expect(validationResponse.isValid).toBe(false);
      expect(validationResponse.errors).toContain(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => usePhoneSelection());

      // Set an error first
      act(() => {
        result.current.searchBrands(''); // This should set an error
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset all state', () => {
      const { result } = renderHook(() => usePhoneSelection());

      // Set some state first
      act(() => {
        // Simulate having some state
        result.current.searchBrands('Samsung');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.brands).toEqual([]);
      expect(result.current.models).toEqual([]);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});