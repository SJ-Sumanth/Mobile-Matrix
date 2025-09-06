import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../chat/route';

// Mock the AI service
vi.mock('../../../services/ai', () => ({
  createAIService: vi.fn(() => ({
    processUserMessage: vi.fn(),
    generateContext: vi.fn(),
  })),
}));

// Mock the database
vi.mock('../../../lib/database', () => ({
  prisma: {
    chatSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('/api/chat Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles new chat session creation', async () => {
    const mockAIService = {
      processUserMessage: vi.fn().mockResolvedValue({
        message: 'Hello! Which phone brands would you like to compare?',
        confidence: 0.9,
        suggestions: ['Apple', 'Samsung', 'Google'],
      }),
      generateContext: vi.fn().mockResolvedValue({
        sessionId: 'new-session',
        currentStep: 'brand_selection',
        conversationHistory: [],
        selectedPhones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const { createAIService } = await import('../../../services/ai');
    (createAIService as any).mockReturnValue(mockAIService);

    const { prisma } = await import('../../../lib/database');
    (prisma.chatSession.create as any).mockResolvedValue({
      id: 'new-session',
      context: JSON.stringify({
        sessionId: 'new-session',
        currentStep: 'brand_selection',
        conversationHistory: [],
        selectedPhones: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Hello! Which phone brands would you like to compare?');
    expect(data.sessionId).toBe('new-session');
    expect(data.suggestions).toEqual(['Apple', 'Samsung', 'Google']);
  });

  it('handles existing chat session', async () => {
    const existingContext = {
      sessionId: 'existing-session',
      currentStep: 'model_selection',
      conversationHistory: [
        { id: '1', role: 'user', content: 'Apple', timestamp: new Date() },
      ],
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAIService = {
      processUserMessage: vi.fn().mockResolvedValue({
        message: 'Great choice! Which iPhone model would you like to compare?',
        confidence: 0.9,
        suggestions: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14'],
      }),
    };

    const { createAIService } = await import('../../../services/ai');
    (createAIService as any).mockReturnValue(mockAIService);

    const { prisma } = await import('../../../lib/database');
    (prisma.chatSession.findUnique as any).mockResolvedValue({
      id: 'existing-session',
      context: JSON.stringify(existingContext),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (prisma.chatSession.update as any).mockResolvedValue({
      id: 'existing-session',
      context: JSON.stringify({
        ...existingContext,
        conversationHistory: [
          ...existingContext.conversationHistory,
          { id: '2', role: 'user', content: 'iPhone', timestamp: new Date() },
        ],
      }),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'iPhone',
        sessionId: 'existing-session',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Great choice! Which iPhone model would you like to compare?');
    expect(data.sessionId).toBe('existing-session');
  });

  it('handles invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message is required');
  });

  it('handles AI service errors gracefully', async () => {
    const mockAIService = {
      processUserMessage: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
      generateContext: vi.fn().mockResolvedValue({
        sessionId: 'error-session',
        currentStep: 'brand_selection',
        conversationHistory: [],
        selectedPhones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const { createAIService } = await import('../../../services/ai');
    (createAIService as any).mockReturnValue(mockAIService);

    const { prisma } = await import('../../../lib/database');
    (prisma.chatSession.create as any).mockResolvedValue({
      id: 'error-session',
      context: JSON.stringify({
        sessionId: 'error-session',
        currentStep: 'brand_selection',
        conversationHistory: [],
        selectedPhones: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process message');
  });

  it('handles database connection errors', async () => {
    const { prisma } = await import('../../../lib/database');
    (prisma.chatSession.create as any).mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process message');
  });

  it('validates message length', async () => {
    const longMessage = 'a'.repeat(1001); // Assuming 1000 char limit

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: longMessage,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Message too long');
  });

  it('handles rate limiting', async () => {
    // Mock rate limiter
    vi.mock('../../../middleware/rateLimit', () => ({
      checkRateLimit: vi.fn().mockResolvedValue(false),
    }));

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded');
  });
});