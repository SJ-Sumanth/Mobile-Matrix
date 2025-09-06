import { describe, it, expect } from 'vitest';
import {
  PhoneSchema,
  PhoneSpecificationsSchema,
  ChatContextSchema,
  ComparisonResultSchema,
  APISuccessResponseSchema,
} from '../index';
import { validateData, safeParseData } from '../../utils/validation';

describe('Schema Validation Tests', () => {
  describe('PhoneSchema', () => {
    it('should validate a complete phone object', () => {
      const validPhone = {
        id: 'phone-1',
        brand: 'Samsung',
        model: 'Galaxy S24',
        variant: '256GB',
        launchDate: new Date('2024-01-01'),
        availability: 'available' as const,
        pricing: {
          mrp: 80000,
          currentPrice: 75000,
          currency: 'INR' as const,
        },
        specifications: {
          display: {
            size: '6.2"',
            resolution: '2340x1080',
            type: 'Dynamic AMOLED',
            refreshRate: 120,
          },
          camera: {
            rear: [
              { megapixels: 50, aperture: 'f/1.8', features: ['OIS'] },
            ],
            front: { megapixels: 12, aperture: 'f/2.2', features: [] },
            features: ['Night Mode', 'Portrait'],
          },
          performance: {
            processor: 'Snapdragon 8 Gen 3',
            ram: ['8GB', '12GB'],
            storage: ['128GB', '256GB'],
          },
          battery: {
            capacity: 4000,
            chargingSpeed: 25,
          },
          connectivity: {
            network: ['5G', '4G'],
            wifi: 'Wi-Fi 6E',
            bluetooth: '5.3',
          },
          build: {
            dimensions: '147 x 70.6 x 7.6 mm',
            weight: '167g',
            materials: ['Aluminum', 'Glass'],
            colors: ['Black', 'White'],
          },
          software: {
            os: 'Android',
            version: '14',
          },
        },
        images: ['image1.jpg', 'image2.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateData(PhoneSchema, validPhone);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid phone object', () => {
      const invalidPhone = {
        id: 'phone-1',
        brand: 'Samsung',
        // Missing required fields
      };

      const result = validateData(PhoneSchema, invalidPhone);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('ChatContextSchema', () => {
    it('should validate a complete chat context', () => {
      const validContext = {
        sessionId: 'session-123',
        userId: 'user-456',
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
        currentStep: 'brand_selection' as const,
        selectedBrand: 'Samsung',
        selectedPhones: ['phone-1', 'phone-2'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateData(ChatContextSchema, validContext);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should safely parse valid data', () => {
      const validData = { mrp: 50000, currentPrice: 45000, currency: 'INR' };
      const result = safeParseData(
        PhoneSchema.shape.pricing,
        validData
      );
      expect(result).not.toBeNull();
      expect(result?.currency).toBe('INR');
    });

    it('should return null for invalid data', () => {
      const invalidData = { mrp: 'invalid', currentPrice: 45000 };
      const result = safeParseData(
        PhoneSchema.shape.pricing,
        invalidData
      );
      expect(result).toBeNull();
    });
  });
});