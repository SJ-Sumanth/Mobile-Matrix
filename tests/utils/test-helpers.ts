import { vi } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { Phone, PhoneSpecifications } from '../../src/types/phone';
import { ChatContext, ChatMessage } from '../../src/types/chat';
import { ComparisonResult } from '../../src/types/comparison';

// Mock data factories
export const createMockPhone = (overrides: Partial<Phone> = {}): Phone => ({
  id: '1',
  brand: 'Apple',
  model: 'iPhone 15',
  launchDate: new Date('2023-09-15'),
  availability: 'available',
  pricing: {
    mrp: 79900,
    currentPrice: 79900,
    currency: 'INR',
  },
  specifications: {
    display: {
      size: '6.1"',
      resolution: '2556x1179',
      type: 'Super Retina XDR',
      refreshRate: 60,
      brightness: 1000,
    },
    camera: {
      rear: [
        {
          megapixels: 48,
          aperture: 'f/1.6',
          features: ['Night mode', 'Portrait mode'],
        },
      ],
      front: {
        megapixels: 12,
        aperture: 'f/1.9',
        features: ['Portrait mode'],
      },
      features: ['Photographic Styles', 'Cinematic mode'],
    },
    performance: {
      processor: 'A16 Bionic',
      gpu: 'Apple GPU',
      ram: ['6GB'],
      storage: ['128GB', '256GB', '512GB'],
      expandableStorage: false,
    },
    battery: {
      capacity: 3349,
      chargingSpeed: 20,
      wirelessCharging: true,
    },
    connectivity: {
      network: ['5G', '4G LTE'],
      wifi: 'Wi-Fi 6',
      bluetooth: '5.3',
      nfc: true,
    },
    build: {
      dimensions: '147.6 x 71.6 x 7.8 mm',
      weight: '171g',
      materials: ['Aluminum', 'Glass'],
      colors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'],
      waterResistance: 'IP68',
    },
    software: {
      os: 'iOS',
      version: '17',
      updateSupport: '5+ years',
    },
  },
  images: [
    'https://example.com/iphone15-front.jpg',
    'https://example.com/iphone15-back.jpg',
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockChatContext = (overrides: Partial<ChatContext> = {}): ChatContext => ({
  sessionId: 'test-session-123',
  conversationHistory: [],
  currentStep: 'brand_selection',
  selectedPhones: [],
  preferences: {
    budget: { max: 100000 },
    priorities: ['camera', 'performance'],
  },
  suggestions: ['Apple', 'Samsung', 'Google'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockChatMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-123',
  role: 'user',
  content: 'Hello, I want to compare phones',
  timestamp: new Date(),
  ...overrides,
});

export const createMockComparison = (overrides: Partial<ComparisonResult> = {}): ComparisonResult => {
  const phone1 = createMockPhone({ id: '1', brand: 'Apple', model: 'iPhone 15' });
  const phone2 = createMockPhone({ 
    id: '2', 
    brand: 'Samsung', 
    model: 'Galaxy S24',
    specifications: {
      ...phone1.specifications,
      performance: {
        processor: 'Snapdragon 8 Gen 3',
        gpu: 'Adreno 750',
        ram: ['8GB'],
        storage: ['128GB', '256GB'],
        expandableStorage: true,
      },
      software: {
        os: 'Android',
        version: '14',
        updateSupport: '4 years',
      },
    },
    pricing: {
      mrp: 74999,
      currentPrice: 74999,
      currency: 'INR',
    },
  });

  return {
    phones: [phone1, phone2],
    categories: [
      {
        name: 'Display',
        phone1Score: 8.5,
        phone2Score: 8.0,
        winner: 'phone1',
        details: 'iPhone 15 has better display quality with Super Retina XDR technology',
      },
      {
        name: 'Camera',
        phone1Score: 9.0,
        phone2Score: 8.5,
        winner: 'phone1',
        details: 'iPhone 15 excels in video recording and computational photography',
      },
      {
        name: 'Performance',
        phone1Score: 9.2,
        phone2Score: 9.0,
        winner: 'phone1',
        details: 'A16 Bionic provides slightly better performance than Snapdragon 8 Gen 3',
      },
      {
        name: 'Battery',
        phone1Score: 7.5,
        phone2Score: 8.5,
        winner: 'phone2',
        details: 'Galaxy S24 has larger battery capacity and faster charging',
      },
    ],
    insights: [
      'iPhone 15 excels in camera and display quality',
      'Galaxy S24 offers better battery life and value for money',
      'Both phones provide flagship-level performance',
    ],
    recommendations: [
      'Choose iPhone 15 for iOS ecosystem and camera quality',
      'Choose Galaxy S24 for Android flexibility and battery life',
    ],
    generatedAt: new Date(),
    ...overrides,
  };
};

// Test utilities
export const mockNextRouter = () => {
  const push = vi.fn();
  const replace = vi.fn();
  const prefetch = vi.fn();
  const back = vi.fn();
  const reload = vi.fn();

  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push,
      replace,
      prefetch,
      back,
      reload,
      pathname: '/',
      query: {},
      asPath: '/',
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }));

  return { push, replace, prefetch, back, reload };
};

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

export const mockSessionStorage = () => {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

export const mockFetch = (mockResponse: any, status = 200) => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(mockResponse),
    text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
  });

  global.fetch = mockFetch;
  return mockFetch;
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });

  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });

  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Add any providers here if needed
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Wait utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
};

// Database test utilities
export const createTestDatabase = async () => {
  // This would set up a test database instance
  // Implementation depends on your database setup
};

export const cleanupTestDatabase = async () => {
  // This would clean up the test database
  // Implementation depends on your database setup
};

// API mocking utilities
export const mockAIService = () => {
  return {
    processUserMessage: vi.fn().mockResolvedValue({
      message: 'Test AI response',
      confidence: 0.9,
      suggestions: ['Test suggestion'],
    }),
    extractPhoneSelection: vi.fn().mockResolvedValue({
      brand: 'Apple',
      model: 'iPhone 15',
      variant: undefined,
    }),
    generateComparison: vi.fn().mockResolvedValue(createMockComparison()),
    generateContext: vi.fn().mockResolvedValue(createMockChatContext()),
  };
};

export const mockPhoneService = () => {
  return {
    getPhoneByModel: vi.fn().mockResolvedValue(createMockPhone()),
    searchPhones: vi.fn().mockResolvedValue([createMockPhone()]),
    getAllBrands: vi.fn().mockResolvedValue(['Apple', 'Samsung', 'Google']),
    getModelsByBrand: vi.fn().mockResolvedValue(['iPhone 15', 'iPhone 15 Pro']),
    updatePhoneData: vi.fn().mockResolvedValue(undefined),
  };
};

// Error simulation utilities
export const simulateNetworkError = () => {
  return vi.fn().mockRejectedValue(new Error('Network error'));
};

export const simulateTimeout = (delay = 5000) => {
  return vi.fn().mockImplementation(() => 
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), delay)
    )
  );
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe } = await import('jest-axe');
  const results = await axe(container);
  return results;
};

export const simulateKeyboardNavigation = (element: HTMLElement, key: string) => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key }));
  element.dispatchEvent(new KeyboardEvent('keyup', { key }));
};

// Visual testing utilities
export const compareScreenshots = async (actual: string, expected: string) => {
  // This would implement screenshot comparison logic
  // Could use libraries like pixelmatch or jest-image-snapshot
};

export const generateTestId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};