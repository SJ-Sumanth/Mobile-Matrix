import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelectionState } from '../useSelectionState';
import { PhoneSelection } from '@/types/phone';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock data
const mockSelection1: PhoneSelection = {
  brand: 'Samsung',
  model: 'Galaxy S24',
  variant: '256GB',
};

const mockSelection2: PhoneSelection = {
  brand: 'Apple',
  model: 'iPhone 15',
  variant: '128GB',
};

const mockSelection3: PhoneSelection = {
  brand: 'OnePlus',
  model: '12',
  variant: '256GB',
};

describe('useSelectionState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useSelectionState());

    expect(result.current.selections).toEqual([]);
    expect(result.current.currentStep).toBe('brand_selection');
    expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  it('should load state from localStorage on mount', () => {
    const savedState = {
      selections: [mockSelection1],
      currentStep: 'model_selection',
      sessionId: 'test-session-id',
      timestamp: Date.now(),
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

    const { result } = renderHook(() => useSelectionState());

    expect(result.current.selections).toEqual([mockSelection1]);
    expect(result.current.currentStep).toBe('model_selection');
    expect(result.current.sessionId).toBe('test-session-id');
  });

  it('should not load expired state from localStorage', () => {
    const expiredState = {
      selections: [mockSelection1],
      currentStep: 'model_selection',
      sessionId: 'test-session-id',
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredState));

    const { result } = renderHook(() => useSelectionState());

    expect(result.current.selections).toEqual([]);
    expect(result.current.currentStep).toBe('brand_selection');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mobile-matrix-selection-state');
  });

  it('should handle corrupted localStorage data', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    const { result } = renderHook(() => useSelectionState());

    expect(result.current.selections).toEqual([]);
    expect(result.current.currentStep).toBe('brand_selection');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mobile-matrix-selection-state');
  });

  describe('addSelection', () => {
    it('should add a new selection', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
      });

      expect(result.current.selections).toEqual([mockSelection1]);
      expect(result.current.currentStep).toBe('model_selection');
    });

    it('should update step to comparison when 2 selections are added', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.addSelection(mockSelection2);
      });

      expect(result.current.selections).toEqual([mockSelection1, mockSelection2]);
      expect(result.current.currentStep).toBe('comparison');
    });

    it('should not add duplicate selections', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.addSelection(mockSelection1);
      });

      expect(result.current.selections).toEqual([mockSelection1]);
    });

    it('should limit selections to maximum allowed', () => {
      const { result } = renderHook(() => useSelectionState());

      const selection4: PhoneSelection = { brand: 'Xiaomi', model: '14', variant: '256GB' };
      const selection5: PhoneSelection = { brand: 'Google', model: 'Pixel 8', variant: '128GB' };

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.addSelection(mockSelection2);
        result.current.addSelection(mockSelection3);
        result.current.addSelection(selection4);
        result.current.addSelection(selection5); // This should remove the first one
      });

      expect(result.current.selections).toHaveLength(4);
      expect(result.current.selections[0]).toEqual(mockSelection2); // First one removed
      expect(result.current.selections[3]).toEqual(selection5); // Last one added
    });
  });

  describe('removeSelection', () => {
    it('should remove selection by index', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.addSelection(mockSelection2);
      });

      act(() => {
        result.current.removeSelection(0);
      });

      expect(result.current.selections).toEqual([mockSelection2]);
      expect(result.current.currentStep).toBe('model_selection');
    });

    it('should update step correctly after removal', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.addSelection(mockSelection2);
        result.current.addSelection(mockSelection3);
      });

      expect(result.current.currentStep).toBe('comparison');

      act(() => {
        result.current.removeSelection(0);
        result.current.removeSelection(0);
      });

      expect(result.current.selections).toEqual([mockSelection3]);
      expect(result.current.currentStep).toBe('model_selection');

      act(() => {
        result.current.removeSelection(0);
      });

      expect(result.current.selections).toEqual([]);
      expect(result.current.currentStep).toBe('brand_selection');
    });
  });

  describe('updateSelection', () => {
    it('should update selection by index', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
      });

      const updatedSelection: PhoneSelection = {
        brand: 'Samsung',
        model: 'Galaxy S24+',
        variant: '512GB',
      };

      act(() => {
        result.current.updateSelection(0, updatedSelection);
      });

      expect(result.current.selections[0]).toEqual(updatedSelection);
    });
  });

  describe('clearSelections', () => {
    it('should clear all selections', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.addSelection(mockSelection2);
      });

      act(() => {
        result.current.clearSelections();
      });

      expect(result.current.selections).toEqual([]);
      expect(result.current.currentStep).toBe('brand_selection');
    });
  });

  describe('setCurrentStep', () => {
    it('should set current step', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.setCurrentStep('comparison');
      });

      expect(result.current.currentStep).toBe('comparison');
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile-matrix-selection-state',
        expect.stringContaining('"selections":[{"brand":"Samsung","model":"Galaxy S24","variant":"256GB"}]')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useSelectionState());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.addSelection(mockSelection1);
        });
      }).not.toThrow();
    });

    it('should manually persist state', () => {
      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.addSelection(mockSelection1);
        result.current.persistState();
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should manually load state', () => {
      const savedState = {
        selections: [mockSelection1],
        currentStep: 'model_selection',
        sessionId: 'test-session-id',
        timestamp: Date.now(),
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const { result } = renderHook(() => useSelectionState());

      act(() => {
        result.current.loadState();
      });

      expect(result.current.selections).toEqual([mockSelection1]);
      expect(result.current.currentStep).toBe('model_selection');
    });
  });
});