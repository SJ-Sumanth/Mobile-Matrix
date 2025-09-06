/**
 * Advanced AI Service Usage Examples
 * Demonstrates the new Google Flash 2.5 integration with complex features
 */

import { 
  AdvancedAIService, 
  AIServiceUtils, 
  advancedAIService,
  createAIService 
} from '../src/services/ai';
import { ChatContext, ChatStep } from '../src/types/chat';

// Example 1: Basic Usage with Flash 2.5
async function basicUsageExample() {
  console.log('🚀 Basic Flash 2.5 Usage Example');
  
  // Create service with recommended production config
  const config = AIServiceUtils.getRecommendedConfig('production');
  const aiService = createAIService(config);
  
  // Create a sample context
  const context: ChatContext = {
    sessionId: 'example-session-1',
    conversationHistory: [],
    currentStep: 'brand_selection' as ChatStep,
    selectedPhones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  try {
    // Process user message
    const response = await aiService.processUserMessage(
      'I need a phone with excellent camera for photography under ₹50,000',
      context
    );
    
    console.log('✅ AI Response:', {
      message: response.message,
      suggestions: response.suggestions,
      confidence: response.confidence,
      extractedData: response.extractedData,
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Advanced Configuration
async function advancedConfigurationExample() {
  console.log('🔧 Advanced Configuration Example');
  
  const aiService = new AdvancedAIService({
    model: 'gemini-2.0-flash-exp',
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxTokens: 8192,
    enableFunctionCalling: true,
    enableSafetySettings: true,
    enableContextCaching: true,
    streamingEnabled: false,
    timeout: 45000,
    retryAttempts: 3,
  });
  
  // Check health status
  const health = await aiService.getHealthStatus();
  console.log('🏥 Health Status:', health);
  
  // Process complex query
  const context: ChatContext = {
    sessionId: 'advanced-session',
    conversationHistory: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'I am a professional photographer',
        timestamp: new Date(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Great! I can help you find phones with excellent camera capabilities.',
        timestamp: new Date(),
      },
    ],
    currentStep: 'model_selection' as ChatStep,
    selectedPhones: [],
    preferences: {
      budget: { max: 80000 },
      priorities: ['camera', 'display', 'performance'],
      usage: 'photography',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const response = await aiService.processUserMessage(
    'Compare iPhone 15 Pro vs Samsung Galaxy S24 Ultra for professional photography',
    context
  );
  
  console.log('📸 Photography Comparison:', response);
}

// Example 3: Function Calling Demonstration
async function functionCallingExample() {
  console.log('🔧 Function Calling Example');
  
  const aiService = new AdvancedAIService({
    enableFunctionCalling: true,
    model: 'gemini-2.0-flash-exp',
  });
  
  const context: ChatContext = {
    sessionId: 'function-session',
    conversationHistory: [],
    currentStep: 'brand_selection' as ChatStep,
    selectedPhones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // This should trigger function calling
  const response = await aiService.processUserMessage(
    'Search for gaming phones under ₹30,000 with good battery life',
    context
  );
  
  console.log('🎮 Gaming Phone Search:', {
    message: response.message,
    functionCalls: response.extractedData?.functionCalls,
    suggestions: response.suggestions,
  });
}

// Example 4: Metrics and Monitoring
async function metricsExample() {
  console.log('📊 Metrics and Monitoring Example');
  
  const aiService = advancedAIService.instance;
  
  const context: ChatContext = {
    sessionId: 'metrics-session',
    conversationHistory: [],
    currentStep: 'comparison' as ChatStep,
    selectedPhones: ['iPhone 15', 'Samsung Galaxy S24'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Process multiple messages to generate metrics
  const messages = [
    'Compare these phones for camera quality',
    'Which one has better battery life?',
    'What about gaming performance?',
    'Show me the price difference',
  ];
  
  for (const message of messages) {
    await aiService.processUserMessage(message, context);
  }
  
  // Get metrics
  const metrics = aiService.getResponseMetrics();
  console.log('📈 Response Metrics:', {
    totalResponses: metrics.size,
    metrics: Array.from(metrics.entries()).map(([id, metric]) => ({
      id,
      responseTime: `${metric.responseTime}ms`,
      confidence: metric.confidence,
      tokenCount: metric.tokenCount,
      functionCalls: metric.functionCallsUsed,
    })),
  });
  
  // Get health status
  const health = await aiService.getHealthStatus();
  console.log('🏥 Service Health:', health);
}

// Example 5: Error Handling and Fallbacks
async function errorHandlingExample() {
  console.log('🛡️  Error Handling Example');
  
  // Create service with invalid API key to test fallbacks
  const aiService = new AdvancedAIService({
    apiKey: 'invalid-key',
    model: 'gemini-2.0-flash-exp',
  });
  
  const context: ChatContext = {
    sessionId: 'error-session',
    conversationHistory: [],
    currentStep: 'brand_selection' as ChatStep,
    selectedPhones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  try {
    const response = await aiService.processUserMessage(
      'Recommend a phone for me',
      context
    );
    
    console.log('🔄 Fallback Response:', {
      message: response.message,
      fallbackUsed: response.extractedData?.fallbackUsed,
      confidence: response.confidence,
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Example 6: Configuration Validation
function configurationValidationExample() {
  console.log('✅ Configuration Validation Example');
  
  // Test valid configuration
  const validConfig = {
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
    maxTokens: 8192,
  };
  
  const validResult = AIServiceUtils.validateConfig(validConfig);
  console.log('Valid Config Result:', validResult);
  
  // Test invalid configuration
  const invalidConfig = {
    temperature: 3.0, // Too high
    topP: 1.5, // Too high
    topK: 0, // Too low
    maxTokens: -100, // Negative
  };
  
  const invalidResult = AIServiceUtils.validateConfig(invalidConfig);
  console.log('Invalid Config Result:', invalidResult);
  
  // Get recommended configurations
  console.log('Recommended Configs:');
  console.log('Development:', AIServiceUtils.getRecommendedConfig('development'));
  console.log('Production:', AIServiceUtils.getRecommendedConfig('production'));
  console.log('Testing:', AIServiceUtils.getRecommendedConfig('testing'));
}

// Example 7: Singleton Usage
async function singletonUsageExample() {
  console.log('🔄 Singleton Usage Example');
  
  // Configure the singleton
  const configuredService = advancedAIService.configure({
    model: 'gemini-2.0-flash-exp',
    temperature: 0.8,
    enableFunctionCalling: true,
  });
  
  // Use the singleton instance
  const instance1 = advancedAIService.instance;
  const instance2 = advancedAIService.instance;
  
  console.log('Same instance?', instance1 === instance2); // Should be true
  
  const context: ChatContext = {
    sessionId: 'singleton-session',
    conversationHistory: [],
    currentStep: 'brand_selection' as ChatStep,
    selectedPhones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const response = await instance1.processUserMessage('Hello!', context);
  console.log('Singleton Response:', response.message);
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Running Advanced AI Service Examples\n');
  
  try {
    await basicUsageExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await advancedConfigurationExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await functionCallingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await metricsExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await errorHandlingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    configurationValidationExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await singletonUsageExample();
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for use in other files
export {
  basicUsageExample,
  advancedConfigurationExample,
  functionCallingExample,
  metricsExample,
  errorHandlingExample,
  configurationValidationExample,
  singletonUsageExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}