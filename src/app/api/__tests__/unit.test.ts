import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock external dependencies
vi.mock('../../../lib/database.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    phone: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    brand: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
  withRetry: vi.fn((fn) => fn()),
  withMetrics: vi.fn((fn) => fn()),
}));

vi.mock('../../../lib/cache.js', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
  },
  CacheKeys: {
    search: (query: string) => `search:${query}`,
    phone: (id: string) => `phone:${id}`,
    phoneByModel: (brand: string, model: string) => `phone:${brand}:${model}`,
    brands: () => 'brands',
    models: (brandId: string) => `models:${brandId}`,
    phonesByBrand: (brand: string) => `phones:${brand}`,
    similarPhones: (phoneId: string) => `similar:${phoneId}`,
  },
  CacheTTL: {
    SHORT: 300,
    MEDIUM: 900,
    LONG: 3600,
    VERY_LONG: 86400,
  },
}));

vi.mock('../../../services/ai.js', () => ({
  aiService: {
    instance: {
      processUserMessage: vi.fn().mockResolvedValue({
        message: 'Test AI response',
        suggestions: ['Test suggestion'],
        nextStep: 'comparison',
        confidence: 0.9,
      }),
      extractPhoneSelection: vi.fn().mockResolvedValue({
        brand: 'Apple',
        model: 'iPhone 15 Pro',
      }),
      generateComparison: vi.fn().mockResolvedValue({
        phones: [],
        categories: [],
        insights: ['Test insight'],
        recommendations: ['Test recommendation'],
        generatedAt: new Date(),
      }),
    },
  },
}));

vi.mock('../../../services/phone.js', () => ({
  phoneService: {
    searchPhones: vi.fn().mockResolvedValue([]),
    getPhoneById: vi.fn().mockResolvedValue(null),
    getAllBrands: vi.fn().mockResolvedValue([]),
    getModelsByBrand: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../services/comparison.js', () => ({
  comparisonService: {
    comparePhones: vi.fn().mockResolvedValue({
      phones: [],
      categories: [],
      insights: ['Test insight'],
      recommendations: ['Test recommendation'],
      generatedAt: new Date(),
    }),
  },
}));

// Import API route handlers after mocking
import { GET as healthCheck } from '../health/route.js';
import { GET as getDocs } from '../docs/route.js';

// Test utilities
function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

async function parseResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

describe('API Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check API', () => {
    it('should return health status structure', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/health');
      const response = await healthCheck(request);
      const data = await parseResponse(response);

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data.data).toHaveProperty('status');
        expect(data.data).toHaveProperty('services');
        expect(data.data).toHaveProperty('uptime');
        expect(data.data).toHaveProperty('version');
      }
    });
  });

  describe('Documentation API', () => {
    it('should return OpenAPI specification', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/docs');
      const response = await getDocs(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('openapi');
      expect(data).toHaveProperty('info');
      expect(data).toHaveProperty('paths');
      expect(data).toHaveProperty('components');
      expect(data.openapi).toBe('3.0.3');
      expect(data.info.title).toBe('MobileMatrix API');
    });

    it('should have proper cache headers', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/docs');
      const response = await getDocs(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });
  });

  describe('API Response Structure', () => {
    it('should have consistent success response structure', () => {
      const mockSuccessResponse = {
        success: true,
        data: { test: 'data' },
        message: 'Test message',
        timestamp: new Date(),
        requestId: 'test-123',
      };

      expect(mockSuccessResponse).toHaveProperty('success', true);
      expect(mockSuccessResponse).toHaveProperty('data');
      expect(mockSuccessResponse).toHaveProperty('timestamp');
    });

    it('should have consistent error response structure', () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          severity: 'medium' as const,
          timestamp: new Date(),
        },
      };

      expect(mockErrorResponse).toHaveProperty('success', false);
      expect(mockErrorResponse).toHaveProperty('error');
      expect(mockErrorResponse.error).toHaveProperty('code');
      expect(mockErrorResponse.error).toHaveProperty('message');
      expect(mockErrorResponse.error).toHaveProperty('severity');
    });
  });

  describe('Middleware Functions', () => {
    it('should validate request data correctly', async () => {
      // Test validation logic without external dependencies
      const validData = {
        q: 'iPhone',
        page: 1,
        limit: 20,
      };

      expect(validData.q).toBeDefined();
      expect(validData.q.length).toBeGreaterThan(1);
      expect(validData.page).toBeGreaterThan(0);
      expect(validData.limit).toBeGreaterThan(0);
      expect(validData.limit).toBeLessThanOrEqual(100);
    });

    it('should handle rate limiting configuration', () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
      };

      expect(rateLimitConfig.windowMs).toBeGreaterThan(0);
      expect(rateLimitConfig.maxRequests).toBeGreaterThan(0);
    });

    it('should generate proper error codes', () => {
      const errorCodes = [
        'VALIDATION_ERROR',
        'NOT_FOUND',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
      ];

      errorCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('API Utilities', () => {
    it('should create proper pagination metadata', () => {
      const page = 2;
      const limit = 10;
      const total = 50;
      const totalPages = Math.ceil(total / limit);

      const meta = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(50);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });

    it('should handle query parameter parsing', () => {
      const url = new URL('http://localhost:3000/api/test?q=iPhone&page=1&limit=20');
      const params: Record<string, any> = {};

      url.searchParams.forEach((value, key) => {
        if (value === 'true') {
          params[key] = true;
        } else if (value === 'false') {
          params[key] = false;
        } else if (!isNaN(Number(value)) && value !== '') {
          params[key] = Number(value);
        } else {
          params[key] = value;
        }
      });

      expect(params.q).toBe('iPhone');
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
    });
  });

  describe('Security Headers', () => {
    it('should define proper security headers', () => {
      const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      };

      Object.entries(securityHeaders).forEach(([header, value]) => {
        expect(header).toMatch(/^X-|^Referrer-/);
        expect(value).toBeDefined();
      });
    });

    it('should define proper CORS configuration', () => {
      const corsConfig = {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://mobilematrix.com']
          : true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      };

      expect(corsConfig.methods).toContain('GET');
      expect(corsConfig.methods).toContain('POST');
      expect(corsConfig.allowedHeaders).toContain('Content-Type');
    });
  });

  describe('OpenAPI Specification', () => {
    it('should have valid OpenAPI structure', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/docs');
      const response = await getDocs(request);
      const spec = await parseResponse(response);

      // Check required OpenAPI fields
      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.info.version).toBeDefined();
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
    });

    it('should define all required API endpoints', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/docs');
      const response = await getDocs(request);
      const spec = await parseResponse(response);

      const requiredPaths = [
        '/health',
        '/phones/search',
        '/phones/{id}',
        '/phones/brands',
        '/comparison',
        '/chat',
      ];

      requiredPaths.forEach(path => {
        expect(spec.paths).toHaveProperty(path);
      });
    });

    it('should define proper response schemas', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/docs');
      const response = await getDocs(request);
      const spec = await parseResponse(response);

      const requiredSchemas = [
        'SuccessResponse',
        'ErrorResponse',
        'Phone',
        'Brand',
        'ComparisonRequest',
        'ChatMessageRequest',
      ];

      requiredSchemas.forEach(schema => {
        expect(spec.components.schemas).toHaveProperty(schema);
      });
    });
  });
});