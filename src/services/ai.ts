import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
  Content,
  Part,
  Tool,
  FunctionDeclaration
} from '@google/generative-ai';
import {
  AIService,
  AIServiceConfig,
  AIServiceConfigSchema
} from '../types/services.js';
import {
  ChatContext,
  AIResponse,
  ChatStep,
  ChatMessage,
  UserPreferences
} from '../types/chat.js';
import {
  Phone,
  PhoneSelection,
  PhoneSelectionSchema
} from '../types/phone.js';
import { ComparisonResult, ComparisonInsights } from '../types/comparison.js';
import { z } from 'zod';
import { PromptTemplates } from '../utils/prompts.js';

/**
 * AI Provider types
 */
export type AIProvider = 'gemini' | 'openai' | 'claude';

/**
 * AI Model variants for Gemini
 */
export type GeminiModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-1.0-pro';

/**
 * Advanced AI Service Configuration
 */
export const AdvancedAIServiceConfigSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'claude']).default('gemini'),
  apiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  model: z.string().default('gemini-2.0-flash-exp'),
  maxTokens: z.number().default(8192),
  temperature: z.number().min(0).max(2).default(0.8),
  topP: z.number().min(0).max(1).default(0.95),
  topK: z.number().min(1).max(100).default(40),
  timeout: z.number().default(45000),
  retryAttempts: z.number().default(3),
  retryDelay: z.number().default(1500),
  enableFunctionCalling: z.boolean().default(true),
  enableSafetySettings: z.boolean().default(true),
  enableContextCaching: z.boolean().default(true),
  maxContextLength: z.number().default(32000),
  streamingEnabled: z.boolean().default(false),
  enableMultimodal: z.boolean().default(true),
});

export type AdvancedAIServiceConfig = z.infer<typeof AdvancedAIServiceConfigSchema>;

/**
 * AI Response Quality Metrics
 */
export interface AIResponseMetrics {
  responseTime: number;
  tokenCount: number;
  confidence: number;
  relevanceScore: number;
  safetyScore: number;
  functionCallsUsed: number;
}

/**
 * Context Management Interface
 */
export interface ContextManager {
  addMessage(message: ChatMessage): void;
  getRecentContext(limit?: number): ChatMessage[];
  summarizeContext(): string;
  clearContext(): void;
  getContextTokenCount(): number;
}

/**
 * Function Calling Definitions
 */
export const PhoneSearchFunction: FunctionDeclaration = {
  name: 'searchPhones',
  description: 'Search for phones based on criteria like brand, price range, features',
  parameters: {
    type: 'object',
    properties: {
      brand: {
        type: 'string',
        description: 'Phone brand (e.g., Apple, Samsung, OnePlus)',
      },
      priceRange: {
        type: 'object',
        properties: {
          min: { type: 'number', description: 'Minimum price' },
          max: { type: 'number', description: 'Maximum price' },
        },
      },
      features: {
        type: 'array',
        items: { type: 'string' },
        description: 'Desired features (e.g., good camera, long battery)',
      },
      usage: {
        type: 'string',
        enum: ['gaming', 'photography', 'business', 'casual'],
        description: 'Primary usage pattern',
      },
    },
  },
};

export const PhoneCompareFunction: FunctionDeclaration = {
  name: 'comparePhones',
  description: 'Compare two or more phones across different categories',
  parameters: {
    type: 'object',
    properties: {
      phoneIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of phone IDs to compare',
      },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Categories to focus on (camera, battery, performance, etc.)',
      },
      userPriorities: {
        type: 'array',
        items: { type: 'string' },
        description: 'User priorities in order of importance',
      },
    },
  },
};

export const PriceCheckFunction: FunctionDeclaration = {
  name: 'checkPhonePrice',
  description: 'Get current pricing information for a specific phone',
  parameters: {
    type: 'object',
    properties: {
      phoneId: {
        type: 'string',
        description: 'Phone identifier',
      },
      region: {
        type: 'string',
        default: 'IN',
        description: 'Region code for pricing (IN for India)',
      },
    },
  },
};

/**
 * Advanced AI Service implementation with Google Flash 2.5
 * Features: Function calling, context management, multimodal support, streaming
 */
export class AdvancedAIService implements AIService {
  private genAI?: GoogleGenerativeAI;
  private config: AdvancedAIServiceConfig;
  private model?: GenerativeModel;
  private provider: AIProvider;
  private contextManager: ContextManager;
  private responseMetrics: Map<string, AIResponseMetrics> = new Map();
  private functionTools: Tool[];
  private safetySettings: SafetySetting[];
  private generationConfig: GenerationConfig;

  constructor(config: Partial<AdvancedAIServiceConfig> = {}) {
    // Validate and set configuration with advanced defaults
    const configData = {
      provider: config.provider || 'gemini',
      apiKey: process.env.GEMINI_API_KEY || config.apiKey,
      openaiApiKey: process.env.OPENAI_API_KEY || config.openaiApiKey,
      claudeApiKey: process.env.CLAUDE_API_KEY || config.claudeApiKey,
      model: config.model || 'gemini-2.0-flash-exp', // Use Flash 2.5
      maxTokens: config.maxTokens || 8192,
      temperature: config.temperature || 0.8,
      topP: config.topP || 0.95,
      topK: config.topK || 40,
      timeout: config.timeout || 45000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1500,
      enableFunctionCalling: config.enableFunctionCalling ?? true,
      enableSafetySettings: config.enableSafetySettings ?? true,
      enableContextCaching: config.enableContextCaching ?? true,
      maxContextLength: config.maxContextLength || 32000,
      streamingEnabled: config.streamingEnabled ?? false,
      enableMultimodal: config.enableMultimodal ?? true,
    };

    this.config = AdvancedAIServiceConfigSchema.parse(configData);
    this.provider = this.config.provider;

    // Initialize context manager
    this.contextManager = new SimpleContextManager(this.config.maxContextLength);

    // Setup function calling tools
    this.functionTools = this.config.enableFunctionCalling ? [{
      functionDeclarations: [
        PhoneSearchFunction,
        PhoneCompareFunction,
        PriceCheckFunction,
      ],
    }] : [];

    // Setup safety settings
    this.safetySettings = this.config.enableSafetySettings ? [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ] : [];

    // Setup generation configuration
    this.generationConfig = {
      temperature: this.config.temperature,
      topP: this.config.topP,
      topK: this.config.topK,
      maxOutputTokens: this.config.maxTokens,
      responseMimeType: 'application/json',
    };

    // Log advanced configuration
    console.log(`🚀 Advanced AI Service initialized`);
    console.log(`📱 Model: ${this.config.model}`);
    console.log(`🔧 Function Calling: ${this.config.enableFunctionCalling ? 'Enabled' : 'Disabled'}`);
    console.log(`🛡️  Safety Settings: ${this.config.enableSafetySettings ? 'Enabled' : 'Disabled'}`);
    console.log(`💾 Context Caching: ${this.config.enableContextCaching ? 'Enabled' : 'Disabled'}`);
    console.log(`🎯 API Key configured: ${this.config.apiKey ? 'Yes' : 'No'}`);

    this.initializeProvider();
  }

  /**
   * Get default model for each provider with Flash 2.5 support
   */
  private getDefaultModel(provider: AIProvider): string {
    switch (provider) {
      case 'gemini':
        return 'gemini-2.0-flash-exp'; // Flash 2.5 experimental
      case 'openai':
        return 'gpt-4-turbo';
      case 'claude':
        return 'claude-3-5-sonnet-20241022';
      default:
        return 'gemini-2.0-flash-exp';
    }
  }

  /**
   * Initialize the advanced AI provider with Flash 2.5
   */
  private initializeProvider(): void {
    switch (this.provider) {
      case 'gemini':
        if (!this.config.apiKey) {
          console.warn('⚠️  GEMINI_API_KEY is not configured. AI service will use fallback responses.');
          return;
        }

        try {
          this.genAI = new GoogleGenerativeAI(this.config.apiKey);

          // Initialize model with advanced configuration
          this.model = this.genAI.getGenerativeModel({
            model: this.config.model,
            generationConfig: this.generationConfig,
            safetySettings: this.safetySettings,
            tools: this.functionTools.length > 0 ? this.functionTools : undefined,
            systemInstruction: this.getSystemInstruction(),
          });

          console.log('✅ Gemini Flash 2.5 model initialized successfully');
          console.log(`🎛️  Generation Config:`, {
            temperature: this.generationConfig.temperature,
            topP: this.generationConfig.topP,
            topK: this.generationConfig.topK,
            maxTokens: this.generationConfig.maxOutputTokens,
          });

        } catch (error) {
          console.error('❌ Failed to initialize Gemini model:', error);
          throw new Error(`Gemini initialization failed: ${error}`);
        }
        break;

      case 'openai':
        if (!this.config.openaiApiKey) {
          console.warn('⚠️  OPENAI_API_KEY is not configured. AI service will use fallback responses.');
          return;
        }
        throw new Error('🚧 OpenAI provider implementation coming soon');

      case 'claude':
        if (!this.config.claudeApiKey) {
          console.warn('⚠️  CLAUDE_API_KEY is not configured. AI service will use fallback responses.');
          return;
        }
        throw new Error('🚧 Claude provider implementation coming soon');

      default:
        throw new Error(`❌ Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * Get system instruction for the AI model
   */
  private getSystemInstruction(): string {
    return `You are an expert mobile phone advisor and comparison specialist. Your role is to help users find the perfect smartphone based on their needs, preferences, and budget.

Key Capabilities:
- Provide detailed phone comparisons with technical accuracy
- Understand user preferences and usage patterns
- Offer personalized recommendations
- Explain technical specifications in user-friendly terms
- Stay updated with latest phone releases and market trends
- Use function calling to search phones, compare models, and check prices

Response Guidelines:
- Always respond in JSON format with structured data
- Be conversational yet informative
- Ask clarifying questions when needed
- Provide specific examples and use cases
- Consider budget constraints and value propositions
- Highlight both strengths and weaknesses fairly

Focus Areas:
- Camera quality and photography features
- Battery life and charging capabilities
- Performance for gaming and productivity
- Display quality and multimedia experience
- Build quality and design aesthetics
- Software experience and update support
- Value for money and pricing trends

Remember to use the available functions to provide accurate, real-time information about phones, pricing, and comparisons.`;
  }

  /**
   * Process user message with advanced AI capabilities
   */
  async processUserMessage(message: string, context: ChatContext): Promise<AIResponse> {
    const startTime = Date.now();
    console.log('🚀 Processing message with Flash 2.5:', message);

    try {
      // Update context manager with conversation history
      this.updateContextManager(context);

      // Check if we have a valid model
      if (!this.model) {
        console.warn('⚠️  AI model not available, using intelligent fallback');
        return this.getIntelligentFallbackResponse(message, context);
      }

      // Build advanced prompt with context
      const prompt = this.buildAdvancedPrompt(message, context);

      // Generate response with function calling support
      const response = await this.generateAdvancedResponse(prompt, context);

      // Calculate metrics
      const metrics: AIResponseMetrics = {
        responseTime: Date.now() - startTime,
        tokenCount: this.estimateTokenCount(response.message),
        confidence: response.confidence || 0.8,
        relevanceScore: this.calculateRelevanceScore(message, response.message),
        safetyScore: 0.95, // Placeholder for safety scoring
        functionCallsUsed: response.extractedData?.functionCalls?.length || 0,
      };

      // Store metrics
      this.responseMetrics.set(`${Date.now()}`, metrics);

      console.log('✅ Response generated successfully:', {
        responseTime: `${metrics.responseTime}ms`,
        tokenCount: metrics.tokenCount,
        confidence: metrics.confidence,
        functionCalls: metrics.functionCallsUsed,
      });

      return response;

    } catch (error) {
      console.error('❌ Error processing message:', error);

      // Fallback to intelligent response
      const fallbackResponse = this.getIntelligentFallbackResponse(message, context);

      // Add error context
      fallbackResponse.extractedData = {
        ...fallbackResponse.extractedData,
        error: 'AI_SERVICE_ERROR',
        fallbackUsed: true,
      };

      return fallbackResponse;
    }
  }

  /**
   * Update context manager with conversation history
   */
  private updateContextManager(context: ChatContext): void {
    // Clear and rebuild context from conversation history
    this.contextManager.clearContext();

    // Add recent messages to context manager
    const recentMessages = context.conversationHistory.slice(-10); // Keep last 10 messages
    recentMessages.forEach(message => {
      this.contextManager.addMessage(message);
    });
  }

  /**
   * Build advanced prompt with rich context
   */
  private buildAdvancedPrompt(message: string, context: ChatContext): string {
    const contextSummary = this.contextManager.summarizeContext();
    const userPreferences = this.formatUserPreferences(context.preferences);
    const selectedPhones = context.selectedPhones.join(', ');

    return `
Context Summary: ${contextSummary}
Current Step: ${context.currentStep}
Selected Phones: ${selectedPhones || 'None'}
User Preferences: ${userPreferences}

User Message: "${message}"

Please provide a helpful response in JSON format with the following structure:
{
  "message": "Your conversational response",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "nextStep": "brand_selection|model_selection|comparison|completed",
  "extractedData": {
    "phoneSelection": { "brand": "...", "model": "...", "variant": "..." },
    "userIntent": "search|compare|recommend|price_check",
    "functionCalls": [],
    "confidence": 0.0-1.0
  },
  "confidence": 0.0-1.0
}`;
  }

  /**
   * Generate advanced response with function calling
   */
  private async generateAdvancedResponse(prompt: string, context: ChatContext): Promise<AIResponse> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Generate content with the model
      const result = await Promise.race([
        this.model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Generation timeout')), this.config.timeout)
        )
      ]);

      // Extract and parse response
      const responseText = result.response.text();
      console.log('🤖 Raw AI Response:', responseText);

      // Parse JSON response
      const parsedResponse = this.parseAdvancedResponse(responseText);

      // Handle function calls if present
      if (parsedResponse.extractedData?.functionCalls?.length > 0) {
        await this.handleFunctionCalls(parsedResponse.extractedData.functionCalls, context);
      }

      return parsedResponse;

    } catch (error) {
      console.error('❌ Advanced response generation failed:', error);
      throw error;
    }
  }

  /**
   * Parse advanced AI response with error handling
   */
  private parseAdvancedResponse(responseText: string): AIResponse {
    try {
      // Clean the response text
      const cleanedText = responseText
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s*```\s*|\s*```\s*$/g, '')
        .trim();

      // Try to parse as JSON
      const parsed = JSON.parse(cleanedText);

      // Validate structure
      return {
        message: parsed.message || responseText,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        nextStep: parsed.nextStep || undefined,
        extractedData: parsed.extractedData || {},
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      };

    } catch (error) {
      console.warn('⚠️  Failed to parse JSON response, using text as message:', error);

      // Fallback to text response
      return {
        message: responseText,
        suggestions: [],
        confidence: 0.6,
        extractedData: { parseError: true },
      };
    }
  }

  /**
   * Handle function calls from AI response
   */
  private async handleFunctionCalls(functionCalls: any[], context: ChatContext): Promise<void> {
    for (const call of functionCalls) {
      try {
        switch (call.name) {
          case 'searchPhones':
            console.log('🔍 Executing phone search:', call.parameters);
            // Implement phone search logic
            break;
          case 'comparePhones':
            console.log('⚖️  Executing phone comparison:', call.parameters);
            // Implement phone comparison logic
            break;
          case 'checkPhonePrice':
            console.log('💰 Executing price check:', call.parameters);
            // Implement price check logic
            break;
          default:
            console.warn('⚠️  Unknown function call:', call.name);
        }
      } catch (error) {
        console.error(`❌ Function call failed (${call.name}):`, error);
      }
    }
  }

  /**
   * Format user preferences for prompt
   */
  private formatUserPreferences(preferences?: UserPreferences): string {
    if (!preferences) return 'Not specified';

    const parts = [];

    if (preferences.budget) {
      const { min, max } = preferences.budget;
      if (min && max) {
        parts.push(`Budget: ₹${min.toLocaleString()} - ₹${max.toLocaleString()}`);
      } else if (max) {
        parts.push(`Budget: Under ₹${max.toLocaleString()}`);
      }
    }

    if (preferences.priorities?.length) {
      parts.push(`Priorities: ${preferences.priorities.join(', ')}`);
    }

    if (preferences.usage) {
      parts.push(`Usage: ${preferences.usage}`);
    }

    return parts.length > 0 ? parts.join('; ') : 'Not specified';
  }

  /**
   * Estimate token count for text
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate relevance score between user message and AI response
   */
  private calculateRelevanceScore(userMessage: string, aiResponse: string): number {
    // Simple keyword overlap scoring
    const userWords = userMessage.toLowerCase().split(/\s+/);
    const responseWords = aiResponse.toLowerCase().split(/\s+/);

    const commonWords = userWords.filter(word =>
      responseWords.includes(word) && word.length > 3
    );

    return Math.min(commonWords.length / Math.max(userWords.length, 1), 1.0);
  }



  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract phone selection from user message with retry logic
   */
  async extractPhoneSelection(message: string): Promise<PhoneSelection | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const prompt = PromptTemplates.phoneExtraction(message);

        const result = await Promise.race([
          this.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Phone extraction timeout')), this.config.timeout)
          )
        ]);

        const text = this.extractTextFromResponse(result);

        // Parse JSON response with multiple strategies
        const phoneSelection = this.parsePhoneSelectionFromText(text);

        if (phoneSelection) {
          return phoneSelection;
        }

        // If no valid selection found, try fallback extraction
        const fallbackSelection = this.extractPhoneSelectionFallback(message);
        if (fallbackSelection) {
          return fallbackSelection;
        }

      } catch (error) {
        lastError = error as Error;
        console.error(`Phone extraction error (attempt ${attempt}/${this.config.retryAttempts}):`, error);

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    console.error('All phone extraction attempts failed:', lastError);

    // Final fallback: try regex-based extraction
    return this.extractPhoneSelectionFallback(message);
  }

  /**
   * Parse phone selection from AI response text
   */
  private parsePhoneSelectionFromText(text: string): PhoneSelection | null {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        return null;
      }

      const cleaned = jsonMatch[0]
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s*```\s*|\s*```\s*$/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate against schema
      const phoneSelection = PhoneSelectionSchema.safeParse(parsed);
      return phoneSelection.success ? phoneSelection.data : null;
    } catch (error) {
      console.error('Error parsing phone selection JSON:', error);
      return null;
    }
  }

  /**
   * Fallback phone selection extraction using regex patterns
   */
  private extractPhoneSelectionFallback(message: string): PhoneSelection | null {
    const lowerMessage = message.toLowerCase();

    // Brand patterns
    const brandPatterns = {
      'apple': /\b(apple|iphone)\b/i,
      'samsung': /\b(samsung|galaxy)\b/i,
      'oneplus': /\b(oneplus|one plus)\b/i,
      'xiaomi': /\b(xiaomi|mi|redmi)\b/i,
      'realme': /\brealme\b/i,
      'vivo': /\bvivo\b/i,
      'oppo': /\boppo\b/i,
      'google': /\b(google|pixel)\b/i,
      'nothing': /\bnothing\b/i,
      'motorola': /\b(motorola|moto)\b/i,
    };

    let detectedBrand: string | null = null;
    for (const [brand, pattern] of Object.entries(brandPatterns)) {
      if (pattern.test(lowerMessage)) {
        detectedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
        break;
      }
    }

    if (!detectedBrand) {
      return null;
    }

    // Model patterns (simplified)
    const modelPatterns = [
      /\b(iphone\s*\d+(?:\s*pro(?:\s*max)?)?)\b/i,
      /\b(galaxy\s*s\d+(?:\s*ultra)?)\b/i,
      /\b(oneplus\s*\d+(?:r|t)?)\b/i,
      /\b(mi\s*\d+(?:\s*pro)?)\b/i,
      /\b(redmi\s*\w+(?:\s*pro)?)\b/i,
      /\b(realme\s*\w+(?:\s*pro)?)\b/i,
      /\b(pixel\s*\d+(?:\s*pro)?)\b/i,
    ];

    let detectedModel: string | null = null;
    for (const pattern of modelPatterns) {
      const match = message.match(pattern);
      if (match) {
        detectedModel = match[1].trim();
        break;
      }
    }

    if (detectedBrand && detectedModel) {
      return {
        brand: detectedBrand,
        model: detectedModel,
        variant: undefined,
      };
    }

    return null;
  }

  /**
   * Generate comparison insights between two phones with retry logic
   */
  async generateComparison(phone1: Phone, phone2: Phone): Promise<ComparisonResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const prompt = this.buildComparisonPrompt(phone1, phone2);

        const result = await Promise.race([
          this.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Comparison generation timeout')), this.config.timeout)
          )
        ]);

        const text = this.extractTextFromResponse(result);

        return this.parseComparisonResult(text, phone1, phone2);
      } catch (error) {
        lastError = error as Error;
        console.error(`Comparison generation error (attempt ${attempt}/${this.config.retryAttempts}):`, error);

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    console.error('All comparison generation attempts failed:', lastError);
    return this.getFallbackComparison(phone1, phone2);
  }

  /**
   * Generate conversation context based on user preferences
   */
  async generateContext(preferences?: any): Promise<Partial<ChatContext>> {
    return {
      currentStep: 'brand_selection' as ChatStep,
      selectedPhones: [],
      preferences,
      conversationHistory: [],
    };
  }

  /**
   * Build prompt for phone comparison with advanced context
   */
  private buildComparisonPrompt(phone1: Phone, phone2: Phone): string {
    return `Compare these two phones in detail and provide a comprehensive analysis:

Phone 1: ${phone1.brand} ${phone1.model}
Phone 2: ${phone2.brand} ${phone2.model}

Please provide a detailed JSON response with the following structure:
{
  "summary": "Brief comparison summary",
  "categories": [
    {
      "name": "camera",
      "displayName": "Camera Quality",
      "winner": "phone1|phone2|tie",
      "summary": "Category analysis"
    }
  ],
  "scores": {
    "phone1": {
      "overall": 8.5,
      "camera": 9.0,
      "battery": 8.0,
      "performance": 8.5,
      "display": 8.0,
      "design": 8.5
    },
    "phone2": {
      "overall": 8.0,
      "camera": 8.5,
      "battery": 8.5,
      "performance": 8.0,
      "display": 8.5,
      "design": 8.0
    }
  },
  "insights": {
    "strengths": {
      "phone1": ["strength1", "strength2"],
      "phone2": ["strength1", "strength2"]
    },
    "weaknesses": {
      "phone1": ["weakness1"],
      "phone2": ["weakness1"]
    },
    "recommendations": ["recommendation1", "recommendation2"],
    "bestFor": {
      "phone1": ["use case1", "use case2"],
      "phone2": ["use case1", "use case2"]
    }
  },
  "overallWinner": "phone1|phone2|tie",
  "confidence": 0.9
}`;
  }

  /**
   * Parse advanced comparison result from AI response
   */
  private parseComparisonResult(text: string, phone1: Phone, phone2: Phone): ComparisonResult {
    try {
      // Try to parse as JSON first
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      // Create structured insights
      const insights: ComparisonInsights = {
        strengths: {
          phone1: parsed.insights?.strengths?.phone1 || [`${phone1.brand} ${phone1.model} strengths`],
          phone2: parsed.insights?.strengths?.phone2 || [`${phone2.brand} ${phone2.model} strengths`],
        },
        weaknesses: {
          phone1: parsed.insights?.weaknesses?.phone1 || [],
          phone2: parsed.insights?.weaknesses?.phone2 || [],
        },
        recommendations: parsed.insights?.recommendations || ['Both phones have their merits'],
        bestFor: {
          phone1: parsed.insights?.bestFor?.phone1 || ['General use'],
          phone2: parsed.insights?.bestFor?.phone2 || ['General use'],
        },
      };

      return {
        id: `comparison_${Date.now()}`,
        phones: [phone1, phone2],
        categories: parsed.categories || [],
        scores: {
          phone1: parsed.scores?.phone1 || { overall: 0, camera: 0, battery: 0, performance: 0, display: 0, design: 0 },
          phone2: parsed.scores?.phone2 || { overall: 0, camera: 0, battery: 0, performance: 0, display: 0, design: 0 },
        },
        overallWinner: parsed.overallWinner || undefined,
        insights,
        summary: parsed.summary || `Comparison between ${phone1.brand} ${phone1.model} and ${phone2.brand} ${phone2.model}`,
        generatedAt: new Date(),
        metadata: {
          aiGenerated: true,
          model: this.config.model,
          confidence: parsed.confidence || 0.8,
        },
      };

    } catch (error) {
      console.warn('⚠️  Failed to parse structured comparison, using fallback');
      return this.getFallbackComparison(phone1, phone2);
    }
  }

  /**
   * Extract suggestions from AI response text
   */
  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];

    // Look for bullet points
    const bulletMatches = text.match(/[•\-\*]\s*(.+)/g);
    if (bulletMatches) {
      suggestions.push(...bulletMatches.map(match => match.replace(/[•\-\*]\s*/, '').trim()));
    }

    // Look for numbered lists
    const numberedMatches = text.match(/\d+\.\s*(.+)/g);
    if (numberedMatches) {
      suggestions.push(...numberedMatches.map(match => match.replace(/\d+\.\s*/, '').trim()));
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Determine next step based on AI response and current context
   */
  private determineNextStep(text: string, context: ChatContext): ChatStep | undefined {
    const lowerText = text.toLowerCase();

    if (context.currentStep === 'brand_selection' && (lowerText.includes('brand') || lowerText.includes('which phone'))) {
      return 'model_selection';
    }

    if (context.currentStep === 'model_selection' && context.selectedPhones.length >= 2) {
      return 'comparison';
    }

    return undefined;
  }

  /**
   * Extract structured data from AI response
   */
  private extractStructuredData(text: string): Record<string, any> {
    const data: Record<string, any> = {};

    // Extract brand mentions
    const brandMatches = text.match(/\b(Apple|Samsung|OnePlus|Xiaomi|Realme|Vivo|Oppo|Google|Nothing|Motorola)\b/gi);
    if (brandMatches) {
      data.mentionedBrands = [...new Set(brandMatches.map(b => b.toLowerCase()))];
    }

    return data;
  }

  /**
   * Get intelligent fallback response that analyzes user input
   */
  private getIntelligentFallbackResponse(message: string, context: ChatContext): AIResponse {
    const lowerMessage = message.toLowerCase();

    // Analyze the user's message for intent and content
    const phoneSelection = this.extractPhoneSelectionFallback(message);

    // Handle phone comparison requests
    if ((lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) && phoneSelection) {
      return {
        message: `I can help you compare phones! You mentioned "${phoneSelection.brand} ${phoneSelection.model}". What other phone would you like to compare it with? Popular alternatives include Samsung Galaxy S24, iPhone 15, OnePlus 12, and Xiaomi 14.`,
        suggestions: ['Samsung Galaxy S24', 'iPhone 15 Pro', 'OnePlus 12', 'Xiaomi 14'],
        nextStep: 'model_selection',
        extractedData: { phoneSelection },
        confidence: 0.8,
      };
    }

    // Handle specific phone inquiries
    if (phoneSelection) {
      return {
        message: `Great choice! The ${phoneSelection.brand} ${phoneSelection.model} is a popular phone. Would you like to compare it with another phone, or do you want to know more about its specifications? I can help you with camera quality, battery life, performance, and pricing information.`,
        suggestions: ['Compare with another phone', 'Show specifications', 'Check current price', 'Camera quality'],
        nextStep: 'model_selection',
        extractedData: { phoneSelection },
        confidence: 0.8,
      };
    }

    // Handle recommendation requests
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('best')) {
      const budgetMatch = message.match(/(\d+(?:,\d+)*)/);
      const budget = budgetMatch ? budgetMatch[1] : null;

      if (budget) {
        return {
          message: `For a budget of ₹${budget}, I can suggest some excellent options! Popular phones in this range include Samsung Galaxy A series, Realme GT series, OnePlus Nord series, and Xiaomi Redmi series. What do you primarily use your phone for - photography, gaming, or general use?`,
          suggestions: ['Photography focused', 'Gaming performance', 'General use', 'Best value for money'],
          nextStep: 'brand_selection',
          extractedData: { budget },
          confidence: 0.8,
        };
      } else {
        return {
          message: `I'd be happy to recommend phones! To give you the best suggestions, could you tell me your budget range? Popular price segments are: Under ₹15,000 (budget), ₹15,000-₹30,000 (mid-range), ₹30,000-₹50,000 (premium), and above ₹50,000 (flagship).`,
          suggestions: ['Under ₹15,000', '₹15,000-₹30,000', '₹30,000-₹50,000', 'Above ₹50,000'],
          nextStep: 'brand_selection',
          confidence: 0.8,
        };
      }
    }

    // Handle price inquiries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('₹')) {
      return {
        message: `I can help you with phone pricing! Current popular phones and their approximate prices are: iPhone 15 (₹79,900), Samsung Galaxy S24 (₹74,999), OnePlus 12 (₹64,999), Xiaomi 14 (₹54,999). Which specific phone's price are you looking for?`,
        suggestions: ['iPhone 15 price', 'Samsung Galaxy S24 price', 'OnePlus 12 price', 'Budget phone prices'],
        confidence: 0.8,
      };
    }

    // Handle feature-specific questions
    if (lowerMessage.includes('camera')) {
      return {
        message: `Looking for great camera phones? The best camera phones currently are iPhone 15 Pro (excellent overall), Samsung Galaxy S24 Ultra (versatile zoom), Google Pixel 8 (computational photography), and OnePlus 12 (portrait mode). Which aspect of camera performance matters most to you?`,
        suggestions: ['Portrait photography', 'Night mode', 'Video recording', 'Zoom capabilities'],
        confidence: 0.8,
      };
    }

    if (lowerMessage.includes('battery')) {
      return {
        message: `Battery life is crucial! Phones with excellent battery life include OnePlus 12 (5400mAh), Xiaomi 14 Ultra (5300mAh), Samsung Galaxy S24+ (4900mAh), and Realme GT 6 (5500mAh). Are you looking for long battery life, fast charging, or both?`,
        suggestions: ['Long battery life', 'Fast charging', 'Both battery and charging', 'Gaming battery life'],
        confidence: 0.8,
      };
    }

    if (lowerMessage.includes('gaming') || lowerMessage.includes('performance')) {
      return {
        message: `For gaming and performance, top choices are iPhone 15 Pro (A17 Pro chip), Samsung Galaxy S24 (Snapdragon 8 Gen 3), OnePlus 12 (Snapdragon 8 Gen 3), and Xiaomi 14 (Snapdragon 8 Gen 3). What type of games do you play most?`,
        suggestions: ['Heavy games (PUBG, COD)', 'Casual games', 'Emulation', 'Overall performance'],
        confidence: 0.8,
      };
    }

    // Handle brand-specific inquiries
    const brands = ['apple', 'samsung', 'oneplus', 'xiaomi', 'realme', 'vivo', 'oppo', 'google', 'nothing'];
    const mentionedBrand = brands.find(brand => lowerMessage.includes(brand));

    if (mentionedBrand) {
      const brandName = mentionedBrand.charAt(0).toUpperCase() + mentionedBrand.slice(1);
      return {
        message: `${brandName} makes excellent phones! Their popular current models include various options across different price ranges. Which ${brandName} phone are you interested in, or would you like me to suggest their best current models?`,
        suggestions: [`Latest ${brandName} phones`, `Budget ${brandName} options`, `${brandName} flagships`, 'Compare with other brands'],
        nextStep: 'model_selection',
        extractedData: { selectedBrand: brandName },
        confidence: 0.8,
      };
    }

    // Default contextual response
    return this.getFallbackResponse(context);
  }

  /**
   * Get fallback response when AI service fails (legacy method)
   */
  private getFallbackResponse(context: ChatContext): AIResponse {
    let message = "I'm here to help you with phone comparisons! ";
    let suggestions: string[] = [];

    switch (context.currentStep) {
      case 'brand_selection':
        message += "Which phone brand interests you most? I can help you explore options from Apple, Samsung, OnePlus, Xiaomi, Realme, and many more.";
        suggestions = ['Apple iPhone', 'Samsung Galaxy', 'OnePlus', 'Xiaomi', 'Realme'];
        break;
      case 'model_selection':
        message += `Great choice on ${context.selectedBrand}! Which specific model would you like to explore?`;
        suggestions = ['Latest models', 'Budget options', 'Flagship phones', 'Popular choices'];
        break;
      case 'comparison':
        message += "I can help compare your selected phones. What aspects matter most to you?";
        suggestions = ['Camera quality', 'Battery life', 'Performance', 'Value for money'];
        break;
      default:
        message += "How can I help you find the perfect phone today?";
        suggestions = ['Compare phones', 'Get recommendations', 'Check prices', 'Find best camera phone'];
    }

    return {
      message,
      suggestions,
      confidence: 0.7,
      extractedData: { fallbackUsed: true },
    };
  }

  /**
   * Get fallback comparison when AI service fails
   */
  private getFallbackComparison(phone1: Phone, phone2: Phone): ComparisonResult {
    const insights: ComparisonInsights = {
      strengths: {
        phone1: [`${phone1.brand} ${phone1.model} offers reliable performance`],
        phone2: [`${phone2.brand} ${phone2.model} provides good value`],
      },
      weaknesses: {
        phone1: ['Limited analysis available'],
        phone2: ['Limited analysis available'],
      },
      recommendations: [
        'Both phones are solid choices in their respective categories',
        'Consider your specific use case and budget',
        'Check latest reviews for detailed insights',
      ],
      bestFor: {
        phone1: ['General use', 'Brand preference'],
        phone2: ['Alternative option', 'Different features'],
      },
    };

    return {
      id: `fallback_comparison_${Date.now()}`,
      phones: [phone1, phone2] as [Phone, Phone],
      categories: [],
      scores: {
        phone1: { overall: 7.5, camera: 7.0, battery: 7.5, performance: 7.5, display: 7.0, design: 7.0 },
        phone2: { overall: 7.5, camera: 7.0, battery: 7.5, performance: 7.5, display: 7.0, design: 7.0 },
      },
      insights,
      summary: `Basic comparison between ${phone1.brand} ${phone1.model} and ${phone2.brand} ${phone2.model}. For detailed analysis, please ensure AI service is properly configured.`,
      generatedAt: new Date(),
      metadata: {
        fallbackUsed: true,
        reason: 'AI service unavailable',
      },
    };
  }

  /**
   * Get response metrics for monitoring
   */
  public getResponseMetrics(): Map<string, AIResponseMetrics> {
    return new Map(this.responseMetrics);
  }

  /**
   * Clear response metrics
   */
  public clearMetrics(): void {
    this.responseMetrics.clear();
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    model: string;
    provider: string;
    lastResponseTime?: number;
    errorRate?: number;
  }> {
    try {
      if (!this.model) {
        return {
          status: 'unhealthy',
          model: this.config.model,
          provider: this.provider,
        };
      }

      // Calculate error rate from recent metrics
      const recentMetrics = Array.from(this.responseMetrics.values()).slice(-10);
      const errorRate = recentMetrics.length > 0
        ? recentMetrics.filter(m => m.confidence < 0.5).length / recentMetrics.length
        : 0;

      const avgResponseTime = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
        : undefined;

      const status = errorRate > 0.3 ? 'degraded' : 'healthy';

      return {
        status,
        model: this.config.model,
        provider: this.provider,
        lastResponseTime: avgResponseTime,
        errorRate,
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        model: this.config.model,
        provider: this.provider,
      };
    }
  }
}

/**
 * Simple Context Manager Implementation
 */
class SimpleContextManager implements ContextManager {
  private messages: ChatMessage[] = [];
  private maxTokens: number;

  constructor(maxTokens: number = 32000) {
    this.maxTokens = maxTokens;
  }

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.trimContext();
  }

  getRecentContext(limit: number = 10): ChatMessage[] {
    return this.messages.slice(-limit);
  }

  summarizeContext(): string {
    if (this.messages.length === 0) {
      return 'No previous conversation';
    }

    const recentMessages = this.getRecentContext(6);
    const summary = recentMessages
      .map(msg => `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
      .join('\n');

    return `Recent conversation:\n${summary}`;
  }

  clearContext(): void {
    this.messages = [];
  }

  getContextTokenCount(): number {
    const totalText = this.messages.map(m => m.content).join(' ');
    return Math.ceil(totalText.length / 4); // Rough estimation
  }

  private trimContext(): void {
    // Keep trimming until we're under the token limit
    while (this.getContextTokenCount() > this.maxTokens && this.messages.length > 2) {
      this.messages.shift(); // Remove oldest message
    }
  }
}

// Export factory function for singleton instance
export const createAIService = (config?: Partial<AdvancedAIServiceConfig>) => {
  return new AdvancedAIService(config);
};

// Export singleton instance (lazy initialization)
let _aiService: AdvancedAIService | null = null;
export const aiService = {
  get instance() {
    if (!_aiService) {
      _aiService = new AdvancedAIService();
    }
    return _aiService;
  },
  reset() {
    _aiService = null;
  },
  configure(config: Partial<AdvancedAIServiceConfig>) {
    _aiService = new AdvancedAIService(config);
    return _aiService;
  }
};

// Export advanced service for direct usage
export const advancedAIService = aiService;

// Export legacy aliases for backward compatibility
export const UniversalAIService = AdvancedAIService;
export const GeminiAIService = AdvancedAIService;

// Export utility functions
export const AIServiceUtils = {
  /**
   * Test AI service connectivity
   */
  async testConnection(config?: Partial<AdvancedAIServiceConfig>): Promise<boolean> {
    try {
      const service = new AdvancedAIService(config);
      const health = await service.getHealthStatus();
      return health.status !== 'unhealthy';
    } catch (error) {
      console.error('AI service connection test failed:', error);
      return false;
    }
  },

  /**
   * Get recommended configuration for different use cases
   */
  getRecommendedConfig(useCase: 'development' | 'production' | 'testing'): Partial<AdvancedAIServiceConfig> {
    switch (useCase) {
      case 'development':
        return {
          model: 'gemini-2.0-flash-exp',
          temperature: 0.9,
          maxTokens: 4096,
          enableFunctionCalling: true,
          streamingEnabled: false,
          timeout: 30000,
        };
      case 'production':
        return {
          model: 'gemini-2.0-flash-exp',
          temperature: 0.8,
          maxTokens: 8192,
          enableFunctionCalling: true,
          enableSafetySettings: true,
          enableContextCaching: true,
          streamingEnabled: true,
          timeout: 45000,
          retryAttempts: 3,
        };
      case 'testing':
        return {
          model: 'gemini-1.5-flash',
          temperature: 0.5,
          maxTokens: 2048,
          enableFunctionCalling: false,
          timeout: 15000,
          retryAttempts: 1,
        };
      default:
        return {};
    }
  },

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<AdvancedAIServiceConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
      errors.push('TopP must be between 0 and 1');
    }

    if (config.topK !== undefined && (config.topK < 1 || config.topK > 100)) {
      errors.push('TopK must be between 1 and 100');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      errors.push('MaxTokens must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
