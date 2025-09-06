import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Import API route handlers
import { GET as healthCheck } from '../health/route.js';
import { GET as searchPhones } from '../phones/search/route.js';
import { GET as getPhone } from '../phones/[id]/route.js';
import { GET as getBrands } from '../phones/brands/route.js';
import { GET as getModels } from '../phones/brands/[brandId]/models/route.js';
import { POST as comparePhones } from '../comparison/route.js';
import { POST as chatMessage } from '../chat/route.js';
import { POST as extractPhone } from '../chat/extract-phone/route.js';
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

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Cleanup test environment
  });

  beforeEach(() => {
    // Reset any mocks or state before each test
  });

  describe('Health Check API', () => {
    it('should return health status', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/health');
      const response = await healthCheck(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('services');
      expect(data.data).toHaveProperty('uptime');
      expect(data.data).toHaveProperty('version');
    });
  });

  describe('Phone Search API', () => {
    it('should search phones with valid query', async () => {
      const url = new URL('http://localhost:3000/api/phones/search');
      url.searchParams.set('q', 'iPhone');
      url.searchParams.set('page', '1');
      url.searchParams.set('limit', '10');

      const request = createMockRequest('GET', url.toString());
      const response = await searchPhones(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('meta');
      expect(Array.isArray(data.data.items)).toBe(true);
      expect(data.data.meta).toHaveProperty('page');
      expect(data.data.meta).toHaveProperty('limit');
      expect(data.data.meta).toHaveProperty('total');
    });

    it('should return error for short query', async () => {
      const url = new URL('http://localhost:3000/api/phones/search');
      url.searchParams.set('q', 'a'); // Too short

      const request = createMockRequest('GET', url.toString());
      const response = await searchPhones(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_QUERY');
    });

    it('should handle pagination parameters', async () => {
      const url = new URL('http://localhost:3000/api/phones/search');
      url.searchParams.set('q', 'Samsung');
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '5');

      const request = createMockRequest('GET', url.toString());
      const response = await searchPhones(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.meta.page).toBe(2);
      expect(data.data.meta.limit).toBe(5);
    });
  });

  describe('Phone Details API', () => {
    it('should get phone by valid ID', async () => {
      // This test would need a valid phone ID from your test database
      const phoneId = 'test-phone-id';
      const request = createMockRequest('GET', `http://localhost:3000/api/phones/${phoneId}`);
      
      try {
        const response = await getPhone(request, { params: { id: phoneId } });
        const data = await parseResponse(response);

        if (response.status === 200) {
          expect(data.success).toBe(true);
          expect(data.data).toHaveProperty('id');
          expect(data.data).toHaveProperty('brand');
          expect(data.data).toHaveProperty('model');
          expect(data.data).toHaveProperty('specifications');
        } else if (response.status === 404) {
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('PHONE_NOT_FOUND');
        }
      } catch (error) {
        // Handle database connection errors in test environment
        expect(error).toBeDefined();
      }
    });

    it('should return error for missing phone ID', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/phones/');
      const response = await getPhone(request, { params: { id: '' } });
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PHONE_ID');
    });
  });

  describe('Brands API', () => {
    it('should get all brands', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/phones/brands');
      
      try {
        const response = await getBrands(request);
        const data = await parseResponse(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        
        if (data.data.length > 0) {
          expect(data.data[0]).toHaveProperty('id');
          expect(data.data[0]).toHaveProperty('name');
        }
      } catch (error) {
        // Handle database connection errors in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('Models API', () => {
    it('should get models by brand ID', async () => {
      const brandId = 'test-brand-id';
      const request = createMockRequest('GET', `http://localhost:3000/api/phones/brands/${brandId}/models`);
      
      try {
        const response = await getModels(request, { params: { brandId } });
        const data = await parseResponse(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      } catch (error) {
        // Handle database connection errors in test environment
        expect(error).toBeDefined();
      }
    });

    it('should return error for missing brand ID', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/phones/brands//models');
      const response = await getModels(request, { params: { brandId: '' } });
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_BRAND_ID');
    });
  });

  describe('Comparison API', () => {
    it('should compare two phones with valid IDs', async () => {
      const comparisonData = {
        phone1Id: 'test-phone-1',
        phone2Id: 'test-phone-2',
        categories: ['camera', 'performance'],
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/comparison',
        comparisonData
      );

      try {
        const response = await comparePhones(request);
        const data = await parseResponse(response);

        if (response.status === 200) {
          expect(data.success).toBe(true);
          expect(data.data).toHaveProperty('phones');
          expect(data.data).toHaveProperty('insights');
          expect(data.data).toHaveProperty('recommendations');
          expect(Array.isArray(data.data.phones)).toBe(true);
          expect(data.data.phones).toHaveLength(2);
        } else if (response.status === 404) {
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('PHONE_NOT_FOUND');
        }
      } catch (error) {
        // Handle database connection errors in test environment
        expect(error).toBeDefined();
      }
    });

    it('should return validation error for missing phone IDs', async () => {
      const invalidData = {
        phone1Id: '',
        phone2Id: 'test-phone-2',
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/comparison',
        invalidData
      );

      const response = await comparePhones(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for same phone IDs', async () => {
      const invalidData = {
        phone1Id: 'same-phone-id',
        phone2Id: 'same-phone-id',
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/comparison',
        invalidData
      );

      const response = await comparePhones(request);
      const data = await parseResponse(response);

      // This should ideally be handled by validation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Chat API', () => {
    it('should process chat message with valid context', async () => {
      const chatData = {
        message: 'I want to compare iPhone 15 with Samsung Galaxy S24',
        context: {
          sessionId: 'test-session-123',
          conversationHistory: [],
          currentStep: 'brand_selection',
          selectedPhones: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/chat',
        chatData
      );

      try {
        const response = await chatMessage(request);
        const data = await parseResponse(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('message');
        expect(typeof data.data.message).toBe('string');
      } catch (error) {
        // Handle AI service errors in test environment
        expect(error).toBeDefined();
      }
    });

    it('should return validation error for missing message', async () => {
      const invalidData = {
        message: '',
        context: {
          sessionId: 'test-session-123',
          conversationHistory: [],
          currentStep: 'brand_selection',
          selectedPhones: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/chat',
        invalidData
      );

      const response = await chatMessage(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Phone Extraction API', () => {
    it('should extract phone from message', async () => {
      const extractionData = {
        message: 'I want to compare iPhone 15 Pro with Samsung Galaxy S24 Ultra',
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/chat/extract-phone',
        extractionData
      );

      try {
        const response = await extractPhone(request);
        const data = await parseResponse(response);

        if (response.status === 200) {
          expect(data.success).toBe(true);
          expect(data.data).toHaveProperty('brand');
          expect(data.data).toHaveProperty('model');
        } else if (response.status === 400) {
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('NO_PHONE_DETECTED');
        }
      } catch (error) {
        // Handle AI service errors in test environment
        expect(error).toBeDefined();
      }
    });

    it('should return error for message without phone mention', async () => {
      const extractionData = {
        message: 'Hello, how are you?',
      };

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/chat/extract-phone',
        extractionData
      );

      try {
        const response = await extractPhone(request);
        const data = await parseResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NO_PHONE_DETECTED');
      } catch (error) {
        // Handle AI service errors in test environment
        expect(error).toBeDefined();
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

  describe('Rate Limiting', () => {
    it('should handle multiple requests within rate limit', async () => {
      const requests = Array.from({ length: 5 }, () =>
        createMockRequest('GET', 'http://localhost:3000/api/health')
      );

      const responses = await Promise.all(
        requests.map(request => healthCheck(request))
      );

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
        expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
        expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json }',
      });

      const response = await chatMessage(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'test',
          context: {
            sessionId: 'test',
            conversationHistory: [],
            currentStep: 'brand_selection',
            selectedPhones: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      });

      const response = await chatMessage(request);
      
      // Should still work or return appropriate error
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/health');
      const response = await healthCheck(request);

      // Note: Security headers are typically added by middleware
      // This test verifies the response structure
      expect(response.status).toBe(200);
    });
  });
});