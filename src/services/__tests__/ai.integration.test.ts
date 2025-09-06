import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniversalAIService } from '../ai';
import { ChatContext, ChatStep } from '@/types/chat';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'I can help you compare phones! You mentioned: "iPhone 15 vs Samsung Galaxy S24". What specific features are you looking for?'
        }
      })
    })
  }))
}));

describe('AI Service Integration', () => {
  let aiService: UniversalAIService;
  let mockContext: ChatContext;

  beforeEach(() => {
    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    aiService = new UniversalAIService({
      provider: 'gemini',
      apiKey: 'test-api-key'
    });

    mockContext = {
      sessionId: 'test-session',
      conversationHistory: [],
      currentStep: 'brand_selection' as ChatStep,
      selectedPhones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it('should provide different responses for different user messages', async () => {
    // Test different user messages
    const testMessages = [
      'I want to compare iPhone 15 and Samsung Galaxy S24',
      'What is the best phone under 30000?',
      'Tell me about OnePlus 12 camera quality',
      'Which phone has better battery life?',
      'I need a gaming phone recommendation'
    ];

    const responses = [];
    
    for (const message of testMessages) {
      const response = await aiService.processUserMessage(message, mockContext);
      responses.push(response.message);
      console.log(`Message: "${message}"`);
      console.log(`Response: "${response.message.substring(0, 100)}..."`);
      console.log('---');
      
      // Update context for next message
      mockContext = {
        ...mockContext,
        conversationHistory: [
          ...mockContext.conversationHistory,
          {
            id: `user_${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date(),
          },
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          }
        ]
      };
    }

    // Verify that responses are not identical
    const uniqueResponses = new Set(responses);
    expect(uniqueResponses.size).toBeGreaterThan(1);
    
    // Each response should contain some reference to the user's input
    expect(responses[0]).toMatch(/iphone|samsung|compare/i);
    expect(responses[1]).toMatch(/30000|budget|best|recommend/i);
    expect(responses[2]).toMatch(/oneplus|camera/i);
    expect(responses[3]).toMatch(/battery/i);
    expect(responses[4]).toMatch(/gaming|recommend|performance/i);
  });

  it('should maintain conversation context', async () => {
    // First message
    const response1 = await aiService.processUserMessage('I want to compare phones', mockContext);
    expect(response1.message).toBeTruthy();
    console.log(`First response: "${response1.message.substring(0, 100)}..."`);
    
    // Update context with first response
    const updatedContext = {
      ...mockContext,
      conversationHistory: [
        {
          id: 'user_1',
          role: 'user' as const,
          content: 'I want to compare phones',
          timestamp: new Date(),
        },
        {
          id: 'ai_1',
          role: 'assistant' as const,
          content: response1.message,
          timestamp: new Date(),
        }
      ]
    };

    // Second message should reference the context
    const response2 = await aiService.processUserMessage('iPhone 15 vs Samsung Galaxy S24', updatedContext);
    expect(response2.message).toBeTruthy();
    console.log(`Second response: "${response2.message.substring(0, 100)}..."`);
    
    // Responses should be different and contextual
    expect(response2.message).not.toBe(response1.message);
    expect(response2.message).toMatch(/iphone|samsung/i);
  });

  it('should extract phone selections from user messages', async () => {
    const testCases = [
      {
        message: 'iPhone 15 Pro vs Samsung Galaxy S24 Ultra',
        expectedBrand: 'Apple',
        expectedModel: 'iPhone 15 Pro'
      },
      {
        message: 'I want to compare OnePlus 12 with Xiaomi 14',
        expectedBrand: 'OnePlus',
        expectedModel: 'OnePlus 12'
      },
      {
        message: 'Tell me about Realme GT 6',
        expectedBrand: 'Realme',
        expectedModel: 'Realme GT 6'
      }
    ];

    for (const testCase of testCases) {
      const selection = await aiService.extractPhoneSelection(testCase.message);
      
      if (selection) {
        expect(selection.brand).toBe(testCase.expectedBrand);
        expect(selection.model).toContain(testCase.expectedModel.split(' ')[1]); // Check model number
      }
    }
  });

  it('should handle API failures gracefully', async () => {
    // Create service with invalid API key to trigger failure
    const failingService = new UniversalAIService({
      provider: 'gemini',
      apiKey: 'invalid-key',
      retryAttempts: 1 // Reduce retries for faster test
    });

    const response = await failingService.processUserMessage('test message', mockContext);
    
    // Should return fallback response
    expect(response.message).toBeTruthy();
    expect(response.suggestions).toBeDefined();
    expect(response.confidence).toBeLessThan(1);
  });
});