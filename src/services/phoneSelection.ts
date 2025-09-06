import { Brand, Phone, PhoneSelection } from '@/types/phone';
import { ValidationResult } from '@/types/api';
import { 
  sanitizeBrandName, 
  sanitizePhoneModel, 
  validateBrandName, 
  validatePhoneModel 
} from '@/utils/validation';

interface PhoneSelectionValidationResult extends ValidationResult {
  suggestions: Phone[];
}

/**
 * Service for phone selection and validation logic
 */
class PhoneSelectionService {
  private readonly API_BASE = '/api/phones';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * Search brands with autocomplete functionality
   */
  async searchBrands(query: string): Promise<Brand[]> {
    const sanitizedQuery = sanitizeBrandName(query);
    
    if (!validateBrandName(sanitizedQuery)) {
      throw new Error('Invalid brand name format');
    }

    const cacheKey = `brands:${sanitizedQuery.toLowerCase()}`;
    const cached = this.getFromCache<Brand[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.API_BASE}/brands/search?q=${encodeURIComponent(sanitizedQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search brands: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to search brands');
      }

      const brands = result.data || [];
      this.setCache(cacheKey, brands);
      
      return brands;
    } catch (error) {
      console.error('Error searching brands:', error);
      throw error instanceof Error ? error : new Error('Failed to search brands');
    }
  }

  /**
   * Search models for a specific brand with filtered suggestions
   */
  async searchModels(query: string, brand: string): Promise<string[]> {
    const sanitizedQuery = sanitizePhoneModel(query);
    const sanitizedBrand = sanitizeBrandName(brand);
    
    if (!validatePhoneModel(sanitizedQuery) || !validateBrandName(sanitizedBrand)) {
      throw new Error('Invalid search parameters');
    }

    const cacheKey = `models:${sanitizedBrand.toLowerCase()}:${sanitizedQuery.toLowerCase()}`;
    const cached = this.getFromCache<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/models/search?brand=${encodeURIComponent(sanitizedBrand)}&q=${encodeURIComponent(sanitizedQuery)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search models: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to search models');
      }

      const models = result.data || [];
      this.setCache(cacheKey, models);
      
      return models;
    } catch (error) {
      console.error('Error searching models:', error);
      throw error instanceof Error ? error : new Error('Failed to search models');
    }
  }

  /**
   * Validate phone selection against database
   */
  async validateSelection(selection: PhoneSelection): Promise<PhoneSelectionValidationResult> {
    const sanitizedSelection = this.sanitizeSelection(selection);
    const validationErrors = this.validateSelectionFormat(sanitizedSelection);
    
    if (validationErrors.length > 0) {
      return {
        isValid: false,
        errors: validationErrors,
        suggestions: [],
      };
    }

    try {
      const response = await fetch(`${this.API_BASE}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedSelection),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate selection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        // If validation failed, try to get suggestions
        const suggestions = await this.getSimilarPhones(
          sanitizedSelection.brand,
          sanitizedSelection.model
        );
        
        return {
          isValid: false,
          errors: [result.error?.message || 'Phone not found'],
          suggestions,
        };
      }

      return {
        isValid: true,
        errors: [],
        suggestions: [],
      };
    } catch (error) {
      console.error('Error validating selection:', error);
      
      // Try to get suggestions even on error
      const suggestions = await this.getSimilarPhones(
        sanitizedSelection.brand,
        sanitizedSelection.model
      ).catch(() => []);
      
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        suggestions,
      };
    }
  }

  /**
   * Get similar or alternative phone models
   */
  async getSimilarPhones(brand: string, model: string): Promise<Phone[]> {
    const sanitizedBrand = sanitizeBrandName(brand);
    const sanitizedModel = sanitizePhoneModel(model);
    
    if (!validateBrandName(sanitizedBrand) || !validatePhoneModel(sanitizedModel)) {
      return [];
    }

    const cacheKey = `similar:${sanitizedBrand.toLowerCase()}:${sanitizedModel.toLowerCase()}`;
    const cached = this.getFromCache<Phone[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/similar?brand=${encodeURIComponent(sanitizedBrand)}&model=${encodeURIComponent(sanitizedModel)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to get similar phones: ${response.statusText}`);
        return [];
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('Failed to get similar phones:', result.error?.message);
        return [];
      }

      const phones = result.data || [];
      this.setCache(cacheKey, phones);
      
      return phones;
    } catch (error) {
      console.error('Error getting similar phones:', error);
      return [];
    }
  }

  /**
   * Get phone by exact brand and model match
   */
  async getPhoneByBrandAndModel(brand: string, model: string, variant?: string): Promise<Phone | null> {
    const sanitizedBrand = sanitizeBrandName(brand);
    const sanitizedModel = sanitizePhoneModel(model);
    const sanitizedVariant = variant ? sanitizePhoneModel(variant) : undefined;
    
    if (!validateBrandName(sanitizedBrand) || !validatePhoneModel(sanitizedModel)) {
      throw new Error('Invalid phone parameters');
    }

    const cacheKey = `phone:${sanitizedBrand.toLowerCase()}:${sanitizedModel.toLowerCase()}:${sanitizedVariant?.toLowerCase() || ''}`;
    const cached = this.getFromCache<Phone>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let url = `${this.API_BASE}/by-brand-model?brand=${encodeURIComponent(sanitizedBrand)}&model=${encodeURIComponent(sanitizedModel)}`;
      
      if (sanitizedVariant) {
        url += `&variant=${encodeURIComponent(sanitizedVariant)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get phone: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        return null;
      }

      const phone = result.data;
      this.setCache(cacheKey, phone);
      
      return phone;
    } catch (error) {
      console.error('Error getting phone by brand and model:', error);
      throw error instanceof Error ? error : new Error('Failed to get phone');
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Sanitize phone selection input
   */
  private sanitizeSelection(selection: PhoneSelection): PhoneSelection {
    return {
      brand: sanitizeBrandName(selection.brand),
      model: sanitizePhoneModel(selection.model),
      variant: selection.variant ? sanitizePhoneModel(selection.variant) : undefined,
    };
  }

  /**
   * Validate selection format
   */
  private validateSelectionFormat(selection: PhoneSelection): string[] {
    const errors: string[] = [];
    
    if (!selection.brand || !validateBrandName(selection.brand)) {
      errors.push('Please enter a valid brand name');
    }
    
    if (!selection.model || !validatePhoneModel(selection.model)) {
      errors.push('Please enter a valid model name');
    }
    
    if (selection.variant && !validatePhoneModel(selection.variant)) {
      errors.push('Please enter a valid variant name');
    }
    
    return errors;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Set data in cache with timestamp
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance
export const phoneSelectionService = new PhoneSelectionService();