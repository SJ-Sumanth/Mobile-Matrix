'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { cn } from '@/utils';
import { usePhoneSelection } from '@/hooks/usePhoneSelection';
import { Brand, Phone, PhoneSelection } from '@/types/phone';
import { SearchIcon, XIcon, CheckIcon } from 'lucide-react';

interface PhoneSelectorProps {
  onSelectionComplete: (selection: PhoneSelection) => void;
  onSelectionChange?: (selection: Partial<PhoneSelection>) => void;
  initialSelection?: Partial<PhoneSelection>;
  className?: string;
  disabled?: boolean;
}

export function PhoneSelector({
  onSelectionComplete,
  onSelectionChange,
  initialSelection,
  className,
  disabled = false,
}: PhoneSelectorProps) {
  const {
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
  } = usePhoneSelection();

  const [selection, setSelection] = useState<Partial<PhoneSelection>>(
    initialSelection || {}
  );
  const [brandQuery, setBrandQuery] = useState(initialSelection?.brand || '');
  const [modelQuery, setModelQuery] = useState(initialSelection?.model || '');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Debounced search functions
  const debouncedBrandSearch = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        searchBrands(query);
        setShowBrandSuggestions(true);
      } else {
        setShowBrandSuggestions(false);
      }
    }, 300),
    [searchBrands]
  );

  const debouncedModelSearch = useCallback(
    debounce((query: string, brand: string) => {
      if (query.length >= 1 && brand) {
        searchModels(query, brand);
        setShowModelSuggestions(true);
      } else {
        setShowModelSuggestions(false);
      }
    }, 300),
    [searchModels]
  );

  // Handle brand input change
  const handleBrandChange = (value: string) => {
    setBrandQuery(value);
    const newSelection = { ...selection, brand: value, model: '', variant: '' };
    setSelection(newSelection);
    setModelQuery('');
    clearError();
    
    if (value !== selection.brand) {
      setValidationErrors([]);
    }
    
    debouncedBrandSearch(value);
    onSelectionChange?.(newSelection);
  };

  // Handle model input change
  const handleModelChange = (value: string) => {
    setModelQuery(value);
    const newSelection = { ...selection, model: value, variant: '' };
    setSelection(newSelection);
    clearError();
    
    if (value !== selection.model) {
      setValidationErrors([]);
    }
    
    if (selection.brand) {
      debouncedModelSearch(value, selection.brand);
    }
    onSelectionChange?.(newSelection);
  };

  // Handle brand selection from suggestions
  const handleBrandSelect = (brand: Brand) => {
    setBrandQuery(brand.name);
    const newSelection = { ...selection, brand: brand.name, model: '', variant: '' };
    setSelection(newSelection);
    setModelQuery('');
    setShowBrandSuggestions(false);
    setValidationErrors([]);
    onSelectionChange?.(newSelection);
  };

  // Handle model selection from suggestions
  const handleModelSelect = (model: string) => {
    setModelQuery(model);
    const newSelection = { ...selection, model };
    setSelection(newSelection);
    setShowModelSuggestions(false);
    setValidationErrors([]);
    onSelectionChange?.(newSelection);
  };

  // Handle selection completion
  const handleComplete = async () => {
    if (!selection.brand || !selection.model) {
      setValidationErrors(['Please select both brand and model']);
      return;
    }

    const validation = await validateSelection({
      brand: selection.brand,
      model: selection.model,
      variant: selection.variant,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      if (validation.suggestions.length > 0) {
        getSuggestions(selection.brand, selection.model);
      }
      return;
    }

    onSelectionComplete({
      brand: selection.brand,
      model: selection.model,
      variant: selection.variant,
    });
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (phone: Phone) => {
    setBrandQuery(phone.brand);
    setModelQuery(phone.model);
    const newSelection = {
      brand: phone.brand,
      model: phone.model,
      variant: phone.variant,
    };
    setSelection(newSelection);
    setShowBrandSuggestions(false);
    setShowModelSuggestions(false);
    setValidationErrors([]);
    onSelectionChange?.(newSelection);
  };

  // Clear selection
  const handleClear = () => {
    setBrandQuery('');
    setModelQuery('');
    setSelection({});
    setShowBrandSuggestions(false);
    setShowModelSuggestions(false);
    setValidationErrors([]);
    clearError();
    onSelectionChange?.({});
  };

  // Check if selection is complete
  const isSelectionComplete = selection.brand && selection.model;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Brand Selection */}
      <div className="relative">
        <Input
          label="Phone Brand"
          placeholder="Search for a brand (e.g., Samsung, Apple, OnePlus)"
          value={brandQuery}
          onChange={(e) => handleBrandChange(e.target.value)}
          onFocus={() => {
            if (brandQuery.length >= 2) {
              setShowBrandSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowBrandSuggestions(false), 200);
          }}
          leftIcon={<SearchIcon />}
          rightIcon={
            brandQuery && (
              <button
                onClick={() => handleBrandChange('')}
                className="hover:text-primary"
                type="button"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )
          }
          disabled={disabled}
          error={validationErrors.length > 0}
          errorText={validationErrors.find(err => err.includes('brand'))}
        />

        {/* Brand Suggestions */}
        {showBrandSuggestions && brands.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <div className="p-2">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {brand.logo && (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span className="font-medium">{brand.name}</span>
                    {brand.country && (
                      <span className="text-sm text-muted-foreground">
                        ({brand.country})
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Model Selection */}
      <div className="relative">
        <Input
          label="Phone Model"
          placeholder={
            selection.brand
              ? `Search for a ${selection.brand} model`
              : 'Select a brand first'
          }
          value={modelQuery}
          onChange={(e) => handleModelChange(e.target.value)}
          onFocus={() => {
            if (modelQuery.length >= 1 && selection.brand) {
              setShowModelSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowModelSuggestions(false), 200);
          }}
          leftIcon={<SearchIcon />}
          rightIcon={
            modelQuery && (
              <button
                onClick={() => handleModelChange('')}
                className="hover:text-primary"
                type="button"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )
          }
          disabled={disabled || !selection.brand}
          error={validationErrors.length > 0}
          errorText={validationErrors.find(err => err.includes('model'))}
        />

        {/* Model Suggestions */}
        {showModelSuggestions && models.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <div className="p-2">
              {models.map((model, index) => (
                <button
                  key={`${model}-${index}`}
                  onClick={() => handleModelSelect(model)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors"
                >
                  <span className="font-medium">{model}</span>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <ul className="text-sm text-destructive space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions for Similar Phones */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Did you mean one of these?
          </h4>
          <div className="grid gap-2">
            {suggestions.map((phone) => (
              <button
                key={phone.id}
                onClick={() => handleSuggestionSelect(phone)}
                className="p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {phone.brand} {phone.model}
                      {phone.variant && ` ${phone.variant}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₹{phone.pricing.currentPrice.toLocaleString()}
                    </p>
                  </div>
                  <CheckIcon className="h-4 w-4 text-primary" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          onClick={handleComplete}
          disabled={!isSelectionComplete || isLoading || disabled}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Validating...
            </>
          ) : (
            'Select Phone'
          )}
        </Button>
        
        {(selection.brand || selection.model) && (
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={disabled}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Selection Summary */}
      {isSelectionComplete && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Selected:</span>{' '}
            {selection.brand} {selection.model}
            {selection.variant && ` ${selection.variant}`}
          </p>
        </div>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}