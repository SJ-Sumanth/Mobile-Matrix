/**
 * Example usage of the MobileMatrix type definitions
 * This file demonstrates how to use the various schemas and types
 */

import {
  Phone,
  PhoneSpecifications,
  ChatContext,
  ComparisonResult,
  APIResponse,
  PhoneSchema,
  ChatContextSchema,
  validateData,
  safeParseData,
} from './index';
import { validateData as validate, safeParseData as safeParse } from '../utils/validation';

// Example: Creating a phone object
export const examplePhone: Phone = {
  id: 'samsung-galaxy-s24-ultra',
  brand: 'Samsung',
  model: 'Galaxy S24 Ultra',
  variant: '512GB',
  launchDate: new Date('2024-01-17'),
  availability: 'available',
  pricing: {
    mrp: 129999,
    currentPrice: 119999,
    currency: 'INR',
  },
  specifications: {
    display: {
      size: '6.8"',
      resolution: '3120x1440',
      type: 'Dynamic AMOLED 2X',
      refreshRate: 120,
      brightness: 2600,
    },
    camera: {
      rear: [
        {
          megapixels: 200,
          aperture: 'f/1.7',
          features: ['OIS', 'PDAF'],
          videoRecording: '8K@30fps',
        },
        {
          megapixels: 50,
          aperture: 'f/3.4',
          features: ['Periscope', 'OIS'],
          videoRecording: '4K@60fps',
        },
        {
          megapixels: 12,
          aperture: 'f/2.2',
          features: ['Ultra-wide'],
        },
        {
          megapixels: 10,
          aperture: 'f/2.4',
          features: ['Telephoto', '3x zoom'],
        },
      ],
      front: {
        megapixels: 12,
        aperture: 'f/2.2',
        features: ['Auto-focus'],
      },
      features: ['Night Mode', 'Portrait', 'Pro Mode', 'Single Take'],
    },
    performance: {
      processor: 'Snapdragon 8 Gen 3',
      gpu: 'Adreno 750',
      ram: ['12GB'],
      storage: ['256GB', '512GB', '1TB'],
      expandableStorage: false,
    },
    battery: {
      capacity: 5000,
      chargingSpeed: 45,
      wirelessCharging: true,
    },
    connectivity: {
      network: ['5G', '4G LTE'],
      wifi: 'Wi-Fi 7',
      bluetooth: '5.3',
      nfc: true,
    },
    build: {
      dimensions: '162.3 x 79.0 x 8.6 mm',
      weight: '232g',
      materials: ['Titanium', 'Gorilla Glass Victus 2'],
      colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
      waterResistance: 'IP68',
    },
    software: {
      os: 'Android',
      version: '14',
      updateSupport: '7 years',
    },
  },
  images: [
    'https://example.com/galaxy-s24-ultra-front.jpg',
    'https://example.com/galaxy-s24-ultra-back.jpg',
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Example: Creating a chat context
export const exampleChatContext: ChatContext = {
  sessionId: 'chat-session-12345',
  userId: 'user-67890',
  conversationHistory: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello! I can help you compare phones. Which brands are you interested in?',
      timestamp: new Date(),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'I want to compare Samsung and iPhone',
      timestamp: new Date(),
    },
  ],
  currentStep: 'model_selection',
  selectedBrand: 'Samsung',
  selectedPhones: ['samsung-galaxy-s24-ultra'],
  preferences: {
    budget: {
      min: 50000,
      max: 150000,
    },
    priorities: ['camera', 'performance'],
    usage: 'photography',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Example: Validating data with schemas
export function validatePhoneData(phoneData: unknown): Phone | null {
  const result = validate(PhoneSchema, phoneData);
  
  if (result.isValid) {
    return result.data as Phone;
  } else {
    console.error('Phone validation failed:', result.errors);
    return null;
  }
}

// Example: Safe parsing with error handling
export function parsePhoneDataSafely(phoneData: unknown): Phone | null {
  return safeParse(PhoneSchema, phoneData);
}

// Example: Creating an API response
export function createSuccessResponse<T>(data: T): APIResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date(),
    requestId: `req-${Date.now()}`,
  };
}

export function createErrorResponse(message: string, code: string): APIResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      severity: 'medium',
      timestamp: new Date(),
    },
  };
}

// Example: Type guards
export function isPhone(obj: unknown): obj is Phone {
  return safeParse(PhoneSchema, obj) !== null;
}

export function isChatContext(obj: unknown): obj is ChatContext {
  return safeParse(ChatContextSchema, obj) !== null;
}

// Example: Working with comparison results
export function createMockComparisonResult(phone1: Phone, phone2: Phone): Partial<ComparisonResult> {
  return {
    id: `comparison-${Date.now()}`,
    phones: [phone1, phone2],
    categories: [
      {
        name: 'display',
        displayName: 'Display',
        weight: 0.2,
        comparisons: [
          {
            category: 'Screen Size',
            phone1Value: phone1.specifications.display.size,
            phone2Value: phone2.specifications.display.size,
            winner: 'phone1',
            importance: 'high',
          },
        ],
        winner: 'phone1',
        summary: 'Phone 1 has a larger display',
      },
    ],
    insights: {
      strengths: {
        phone1: ['Larger display', 'Better camera'],
        phone2: ['Better battery life', 'Lower price'],
      },
      weaknesses: {
        phone1: ['Higher price', 'Heavier'],
        phone2: ['Smaller display', 'Older processor'],
      },
      recommendations: [
        'Choose Phone 1 if display quality is important',
        'Choose Phone 2 if budget is a concern',
      ],
      bestFor: {
        phone1: ['Photography', 'Media consumption'],
        phone2: ['Daily usage', 'Budget-conscious users'],
      },
    },
    summary: 'Both phones have their strengths, choose based on your priorities',
    generatedAt: new Date(),
  };
}