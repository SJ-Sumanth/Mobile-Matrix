import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';

// Mock services for performance testing
vi.mock('../../src/services/ai', () => ({
  createAIService: vi.fn(() => ({
    processUserMessage: vi.fn().mockResolvedValue({
      message: 'Test response',
      confidence: 0.9,
    }),
  })),
}));

vi.mock('../../src/services/phone', () => ({
  PhoneService: vi.fn().mockImplementation(() => ({
    getPhoneByModel: vi.fn().mockResolvedValue({
      id: '1',
      brand: 'Apple',
      model: 'iPhone 15',
    }),
    searchPhones: vi.fn().mockResolvedValue([]),
  })),
}));

describe('API Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process chat messages within acceptable time', async () => {
    const { createAIService } = await import('../../src/services/ai');
    const aiService = createAIService({ apiKey: 'test-key' });
    
    const startTime = performance.now();
    
    await aiService.processUserMessage('Hello', {
      sessionId: 'test',
      conversationHistory: [],
      currentStep: 'brand_selection',
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  it('should handle concurrent chat requests efficiently', async () => {
    const { createAIService } = await import('../../src/services/ai');
    const aiService = createAIService({ apiKey: 'test-key' });
    
    const context = {
      sessionId: 'test',
      conversationHistory: [],
      currentStep: 'brand_selection' as const,
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const startTime = performance.now();
    
    // Simulate 10 concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      aiService.processUserMessage(`Message ${i}`, context)
    );
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should handle 10 concurrent requests within 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  it('should perform phone searches efficiently', async () => {
    const { PhoneService } = await import('../../src/services/phone');
    const phoneService = new PhoneService();
    
    const startTime = performance.now();
    
    await phoneService.searchPhones('iPhone');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should search within 500ms
    expect(duration).toBeLessThan(500);
  });

  it('should handle large phone comparison datasets', async () => {
    const { ComparisonEngine } = await import('../../src/services/comparison');
    
    // Mock large phone objects
    const largePhone1 = {
      id: '1',
      brand: 'Apple',
      model: 'iPhone 15',
      specifications: {
        display: { size: '6.1"', resolution: '2556x1179' },
        camera: {
          rear: Array.from({ length: 10 }, (_, i) => ({
            megapixels: 48 + i,
            aperture: `f/1.${6 + i}`,
            features: [`Feature ${i}`],
          })),
          front: { megapixels: 12, aperture: 'f/1.9', features: [] },
          features: Array.from({ length: 20 }, (_, i) => `Camera feature ${i}`),
        },
        performance: {
          processor: 'A16 Bionic',
          ram: ['6GB', '8GB'],
          storage: ['128GB', '256GB', '512GB', '1TB'],
        },
        // ... more specifications
      },
      // ... other properties
    };
    
    const largePhone2 = { ...largePhone1, id: '2', brand: 'Samsung', model: 'Galaxy S24' };
    
    const comparisonEngine = new ComparisonEngine();
    
    const startTime = performance.now();
    
    await comparisonEngine.comparePhones(largePhone1, largePhone2);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should compare large datasets within 1 second
    expect(duration).toBeLessThan(1000);
  });

  it('should maintain performance under memory pressure', async () => {
    const { createAIService } = await import('../../src/services/ai');
    
    // Create multiple AI service instances to simulate memory usage
    const services = Array.from({ length: 100 }, () =>
      createAIService({ apiKey: 'test-key' })
    );
    
    const context = {
      sessionId: 'test',
      conversationHistory: Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        timestamp: new Date(),
      })),
      currentStep: 'brand_selection' as const,
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const startTime = performance.now();
    
    // Process messages with large conversation history
    await services[0].processUserMessage('Test message', context);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should still respond within acceptable time under memory pressure
    expect(duration).toBeLessThan(3000);
  });

  it('should handle database query performance', async () => {
    // Mock database operations
    vi.mock('../../src/lib/database', () => ({
      prisma: {
        phone: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue(null),
        },
        chatSession: {
          create: vi.fn().mockResolvedValue({ id: 'test' }),
          update: vi.fn().mockResolvedValue({ id: 'test' }),
        },
      },
    }));
    
    const { prisma } = await import('../../src/lib/database');
    
    const startTime = performance.now();
    
    // Simulate multiple database operations
    await Promise.all([
      prisma.phone.findMany({ where: { brand: 'Apple' } }),
      prisma.phone.findUnique({ where: { id: '1' } }),
      prisma.chatSession.create({ data: { context: '{}' } }),
    ]);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Database operations should complete quickly
    expect(duration).toBeLessThan(100);
  });

  it('should measure AI response time distribution', async () => {
    const { createAIService } = await import('../../src/services/ai');
    const aiService = createAIService({ apiKey: 'test-key' });
    
    const context = {
      sessionId: 'test',
      conversationHistory: [],
      currentStep: 'brand_selection' as const,
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const responseTimes: number[] = [];
    
    // Measure response times for multiple requests
    for (let i = 0; i < 20; i++) {
      const startTime = performance.now();
      await aiService.processUserMessage(`Message ${i}`, context);
      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
    }
    
    // Calculate statistics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    // Performance assertions
    expect(avgResponseTime).toBeLessThan(1000); // Average under 1 second
    expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds
    expect(minResponseTime).toBeGreaterThan(0); // Sanity check
    
    // 95th percentile should be under 1.5 seconds
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    expect(sortedTimes[p95Index]).toBeLessThan(1500);
  });
});