import { NextRequest, NextResponse } from 'next/server';

// Simple response counter to ensure different responses
let responseCounter = 0;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    responseCounter++;
    
    console.log(`🔍 Simple API: Processing message #${responseCounter}:`, message);
    
    // Create different responses based on counter and message content
    const responses = [
      {
        message: `Response #${responseCounter}: I understand you're asking about "${message}". Let me help you with phone recommendations! What's your budget range?`,
        suggestions: ['Under ₹20,000', '₹20,000-₹40,000', '₹40,000+', 'Best value phones']
      },
      {
        message: `Response #${responseCounter}: Great question about "${message}"! Here are some popular phones:\n\n• iPhone 15 (₹79,900)\n• Samsung Galaxy S24 (₹74,999)\n• OnePlus 12 (₹64,999)\n\nWhich brand interests you?`,
        suggestions: ['Apple iPhone', 'Samsung Galaxy', 'OnePlus', 'Compare these']
      },
      {
        message: `Response #${responseCounter}: You mentioned "${message}". For phone comparisons, I can help with:\n\n• Camera quality analysis\n• Performance benchmarks\n• Battery life comparison\n• Price-to-value ratio\n\nWhat aspect matters most?`,
        suggestions: ['Camera comparison', 'Performance test', 'Battery life', 'Best value']
      },
      {
        message: `Response #${responseCounter}: Interesting! About "${message}" - let me suggest some excellent options:\n\n• **Gaming**: OnePlus 12, iPhone 15 Pro\n• **Photography**: Pixel 8, iPhone 15\n• **Battery**: OnePlus 12, Xiaomi 14\n• **Value**: Realme GT 6, Nothing Phone 2\n\nWhat's your primary use case?`,
        suggestions: ['Gaming phones', 'Camera phones', 'Long battery life', 'Best deals']
      },
      {
        message: `Response #${responseCounter}: Thanks for asking about "${message}"! Current trending phones:\n\n1. **iPhone 15 Pro** - Premium iOS experience\n2. **Samsung S24 Ultra** - Android flagship with S Pen\n3. **OnePlus 12** - Performance focused\n4. **Google Pixel 8** - AI photography\n\nWant detailed comparison?`,
        suggestions: ['iPhone vs Samsung', 'OnePlus vs Pixel', 'Flagship comparison', 'Mid-range options']
      }
    ];
    
    // Handle specific comparison requests
    if (message.toLowerCase().includes('compare') && message.toLowerCase().includes('vs')) {
      const phones = message.match(/(iphone|samsung|oneplus|xiaomi|realme|pixel|nothing)\s*[^\s]*/gi) || [];
      if (phones.length >= 2) {
        return NextResponse.json({
          success: true,
          data: {
            message: `Response #${responseCounter}: Great! Let me compare ${phones[0]} vs ${phones[1]} for you:\n\n**${phones[0]}** is known for its premium build and ecosystem, while **${phones[1]}** offers excellent value and performance.\n\n**Key Differences:**\n• Performance: Both offer flagship-level performance\n• Camera: Different strengths in photography\n• Price: Varies based on specific models\n\nWhat specific aspect would you like me to dive deeper into?`,
            suggestions: ['Camera comparison', 'Performance details', 'Battery life', 'Price difference']
          }
        });
      }
    }
    
    // Cycle through responses
    const responseIndex = (responseCounter - 1) % responses.length;
    const selectedResponse = responses[responseIndex];
    
    console.log(`✅ Simple API: Sending response #${responseCounter}`);
    
    return NextResponse.json({
      success: true,
      data: selectedResponse
    });
    
  } catch (error) {
    console.error('❌ Simple API Error:', error);
    return NextResponse.json({
      success: false,
      error: { message: 'Failed to process message' }
    }, { status: 500 });
  }
}