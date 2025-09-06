import { ChatContext, AIResponse } from '@/types/chat';

/**
 * Test AI service that provides completely different responses each time
 */
class TestAIService {
  private responseCount = 0;

  async processMessage(message: string, context?: ChatContext): Promise<AIResponse> {
    this.responseCount++;
    
    console.log(`🧪 Test AI Processing message #${this.responseCount}:`, message);
    
    // Create completely different responses based on count
    const responses = [
      {
        message: `Response #${this.responseCount}: I understand you said "${message}". Let me help you with phone recommendations! What's your budget range?`,
        suggestions: ['Under ₹20,000', '₹20,000-₹40,000', '₹40,000+', 'Best value phones']
      },
      {
        message: `Response #${this.responseCount}: Great question about "${message}"! Here are some popular phones:\n\n• iPhone 15 (₹79,900)\n• Samsung Galaxy S24 (₹74,999)\n• OnePlus 12 (₹64,999)\n\nWhich brand interests you?`,
        suggestions: ['Apple iPhone', 'Samsung Galaxy', 'OnePlus', 'Compare these']
      },
      {
        message: `Response #${this.responseCount}: You mentioned "${message}". For phone comparisons, I can help with:\n\n• Camera quality analysis\n• Performance benchmarks\n• Battery life comparison\n• Price-to-value ratio\n\nWhat aspect matters most?`,
        suggestions: ['Camera comparison', 'Performance test', 'Battery life', 'Best value']
      },
      {
        message: `Response #${this.responseCount}: Interesting! About "${message}" - let me suggest some excellent options:\n\n• **Gaming**: OnePlus 12, iPhone 15 Pro\n• **Photography**: Pixel 8, iPhone 15\n• **Battery**: OnePlus 12, Xiaomi 14\n• **Value**: Realme GT 6, Nothing Phone 2\n\nWhat's your primary use case?`,
        suggestions: ['Gaming phones', 'Camera phones', 'Long battery life', 'Best deals']
      },
      {
        message: `Response #${this.responseCount}: Thanks for asking about "${message}"! Current trending phones:\n\n1. **iPhone 15 Pro** - Premium iOS experience\n2. **Samsung S24 Ultra** - Android flagship with S Pen\n3. **OnePlus 12** - Performance focused\n4. **Google Pixel 8** - AI photography\n\nWant detailed comparison?`,
        suggestions: ['iPhone vs Samsung', 'OnePlus vs Pixel', 'Flagship comparison', 'Mid-range options']
      }
    ];
    
    // Cycle through responses
    const responseIndex = (this.responseCount - 1) % responses.length;
    const selectedResponse = responses[responseIndex];
    
    console.log(`✅ Test AI Response #${this.responseCount}:`, selectedResponse.message.substring(0, 50) + '...');
    
    return {
      message: selectedResponse.message,
      suggestions: selectedResponse.suggestions,
      confidence: 0.9,
    };
  }
}

// Export singleton instance
export const testAI = new TestAIService();