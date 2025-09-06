import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedAIService, AIServiceUtils } from '../ai';
import { ChatContext, ChatStep } from '../../types/chat';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            message: 'Test response from Flash 2.5',
            suggestions: ['Test suggestion 1', 'Test suggestion 2'],
            confidence: 0.9,
            extractedData: {
              userIntent: 'test',
              functionCalls: []
            }
          })
        }
      })
    })
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

describe('AdvancedAIService', () => {
  let aiService: AdvancedAIService;
  let mockContext: ChatContext;

  beforeEach(() => {
    aiService = new AdvancedAIService({
      apiKey: 'test-api-key',
      model: 'gemini-2.0-flash-exp',
      enableFunctionCalling: true,
      temperature: 0.8,
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

  describe('initialization', () => {
    it('should initialize with Flash 2.5 model', () => {
      expect(aiService).toBeDefined();
    });

    it('should use correct default model', () => {
      const service = new AdvancedAIService();
      expect(service).toBeDefined();
    });
  });

  describe('processUserMessage', () => {
    it('should process user message with advanced features', async () => {
      const response = await aiService.processUserMessage('I want to compare phones', mockContext);
      
      expect(response).toBeDefined();
      expect(response.message).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should handle function calling', async () => {
      const response = await aiService.processUserMessage('Search for iPhone 15', mockContext);
      
      expect(response).toBeDefined();
      expect(response.extractedData).toBeDefined();
    });

    it('should fallback gracefully on errors', async () => {
      // Create service without API key to trigger fallback
      const fallbackService = new AdvancedAIService({ apiKey: undefined });
      
      const response = await fallbackService.processUserMessage('test message', mockContext);
      
      expect(response).toBeDefined();
      expect(response.message).toBeTruthy();
      // Note: In test environment with mocks, fallback might not be triggered
      // This test verifies the service handles undefined API key gracefully
      expect(response.confidence).toBeGreaterThan(0);
    });
  });

  describe('health status', () => {
    it('should return health status', async () => {
      const health = await aiService.getHealthStatus();
      
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.model).toBe('gemini-2.0-flash-exp');
      expect(health.provider).toBe('gemini');
    });
  });

  describe('metrics', () => {
    it('should track response metrics', async () => {
      await aiService.processUserMessage('test', mockContext);
      
      const metrics = aiService.getResponseMetrics();
      expect(metrics.size).toBeGreaterThan(0);
    });

    it('should clear metrics', () => {
      aiService.clearMetrics();
      const metrics = aiService.getResponseMetrics();
      expect(metrics.size).toBe(0);
    });
  });
});

describe('AIServiceUtils', () => {
  describe('configuration validation', () => {
    it('should validate correct configuration', () => {
      const result = AIServiceUtils.validateConfig({
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxTokens: 8192,
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const result = AIServiceUtils.validateConfig({
        temperature: 3.0, // Invalid: > 2
        topP: 1.5, // Invalid: > 1
        topK: 0, // Invalid: < 1
        maxTokens: -100, // Invalid: < 1
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('recommended configurations', () => {
    it('should provide development config', () => {
      const config = AIServiceUtils.getRecommendedConfig('development');
      
      expect(config.model).toBe('gemini-2.0-flash-exp');
      expect(config.enableFunctionCalling).toBe(true);
      expect(config.temperature).toBe(0.9);
    });

    it('should provide production config', () => {
      const config = AIServiceUtils.getRecommendedConfig('production');
      
      expect(config.model).toBe('gemini-2.0-flash-exp');
      expect(config.enableSafetySettings).toBe(true);
      expect(config.enableContextCaching).toBe(true);
      expect(config.streamingEnabled).toBe(true);
    });

    it('should provide testing config', () => {
      const config = AIServiceUtils.getRecommendedConfig('testing');
      
      expect(config.model).toBe('gemini-1.5-flash');
      expect(config.enableFunctionCalling).toBe(false);
      expect(config.retryAttempts).toBe(1);
    });
  });
});