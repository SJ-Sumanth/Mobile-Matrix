'use client';

import { useState, useCallback } from 'react';
import { Brand, Phone, PhoneSelection } from '@/types/phone';
import { phoneSelectionService } from '@/services/phoneSelection';
import { ValidationResult } from '@/types/api';

interface UsePhoneSelectionReturn {
  // State
  brands: Brand[];
  models: string[];
  suggestions: Phone[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  searchBrands: (query: string) => Promise<void>;
  searchModels: (query: string, brand: string) => Promise<void>;
  getSuggestions: (brand: string, model: string) => Promise<void>;
  validateSelection: (selection: PhoneSelection) => Promise<ValidationResult & { suggestions: Phone[] }>;
  clearError: () => void;
  reset: () => void;
}

export function usePhoneSelection(): UsePhoneSelectionReturn {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Phone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search brands with autocomplete
  const searchBrands = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setBrands([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await phoneSelectionService.searchBrands(query);
      setBrands(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search brands');
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search models for a specific brand
  const searchModels = useCallback(async (query: string, brand: string) => {
    if (!query || !brand) {
      setModels([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await phoneSelectionService.searchModels(query, brand);
      setModels(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search models');
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get suggestions for similar phones
  const getSuggestions = useCallback(async (brand: string, model: string) => {
    if (!brand || !model) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await phoneSelectionService.getSimilarPhones(brand, model);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate phone selection
  const validateSelection = useCallback(async (selection: PhoneSelection) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await phoneSelectionService.validateSelection(selection);
      
      if (!result.isValid && result.suggestions) {
        setSuggestions(result.suggestions);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate selection';
      setError(errorMessage);
      
      return {
        isValid: false,
        errors: [errorMessage],
        suggestions: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setBrands([]);
    setModels([]);
    setSuggestions([]);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    brands,
    models,
    suggestions,
    isLoading,
    error,
    searchBrands,
    searchModels,
    getSuggestions,
    validateSelection,
    clearError,
    reset,
  };
}