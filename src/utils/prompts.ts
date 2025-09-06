import { ChatContext } from '../types/chat.js';
import { Phone } from '../types/phone.js';

/**
 * Prompt templates for AI service interactions
 */
export class PromptTemplates {
  /**
   * Brand selection prompt template
   */
  static brandSelection(userMessage: string, context: ChatContext): string {
    return `You are MobileMatrix AI, helping users compare phones in India.

Current task: Help the user select a phone brand for comparison.

User message: "${userMessage}"

Popular Indian phone brands include:
- Apple (iPhone series)
- Samsung (Galaxy series)
- OnePlus (OnePlus series)
- Xiaomi (Mi, Redmi series)
- Realme (Realme series)
- Vivo (V, Y series)
- Oppo (Find, Reno series)
- Google (Pixel series)
- Nothing (Phone series)
- Motorola (Moto series)

Guidelines:
1. If user mentions a brand, acknowledge it and ask for the specific model
2. If user is unsure, suggest 2-3 popular brands based on common preferences
3. If user mentions budget, suggest brands in that range
4. Keep response friendly and conversational
5. Always end by asking for the specific phone model they want to compare

Respond naturally, don't use JSON format.`;
  }

  /**
   * Model selection prompt template
   */
  static modelSelection(userMessage: string, context: ChatContext, availableModels?: string[]): string {
    const modelsText = availableModels ? 
      `Available models for ${context.selectedBrand}: ${availableModels.join(', ')}` : 
      `Popular models from ${context.selectedBrand}`;

    return `You are MobileMatrix AI, helping users select specific phone models.

Current task: Help user select a specific phone model from ${context.selectedBrand}.

User message: "${userMessage}"

${modelsText}

Guidelines:
1. If user mentions a specific model, confirm it and ask for the second phone to compare
2. If user is unsure, suggest 2-3 popular models from the selected brand
3. Consider user's budget if mentioned previously
4. If this is the second phone selection, proceed to comparison
5. Keep response helpful and specific

Current selection status:
- Selected phones: ${context.selectedPhones.join(', ') || 'None yet'}
- Need ${2 - context.selectedPhones.length} more phone(s) for comparison

Respond naturally, don't use JSON format.`;
  }

  /**
   * Comparison generation prompt template
   */
  static comparison(phone1: Phone, phone2: Phone): string {
    return `Generate a comprehensive comparison between these two phones for Indian consumers:

**Phone 1: ${phone1.brand} ${phone1.model}**
- Display: ${phone1.specifications.display.size} ${phone1.specifications.display.type}, ${phone1.specifications.display.resolution}
- Camera: ${phone1.specifications.camera.rear[0]?.megapixels || 'N/A'}MP main rear camera, ${phone1.specifications.camera.front.megapixels}MP front
- Processor: ${phone1.specifications.performance.processor}
- RAM/Storage: ${phone1.specifications.performance.ram.join('/')} RAM, ${phone1.specifications.performance.storage.join('/')} storage
- Battery: ${phone1.specifications.battery.capacity}mAh${phone1.specifications.battery.chargingSpeed ? `, ${phone1.specifications.battery.chargingSpeed}W charging` : ''}
- Price: ₹${phone1.pricing.currentPrice.toLocaleString('en-IN')}
- Launch: ${phone1.launchDate.getFullYear()}

**Phone 2: ${phone2.brand} ${phone2.model}**
- Display: ${phone2.specifications.display.size} ${phone2.specifications.display.type}, ${phone2.specifications.display.resolution}
- Camera: ${phone2.specifications.camera.rear[0]?.megapixels || 'N/A'}MP main rear camera, ${phone2.specifications.camera.front.megapixels}MP front
- Processor: ${phone2.specifications.performance.processor}
- RAM/Storage: ${phone2.specifications.performance.ram.join('/')} RAM, ${phone2.specifications.performance.storage.join('/')} storage
- Battery: ${phone2.specifications.battery.capacity}mAh${phone2.specifications.battery.chargingSpeed ? `, ${phone2.specifications.battery.chargingSpeed}W charging` : ''}
- Price: ₹${phone2.pricing.currentPrice.toLocaleString('en-IN')}
- Launch: ${phone2.launchDate.getFullYear()}

Provide a detailed comparison covering:

1. **Display & Design**: Screen quality, size, build materials, aesthetics
2. **Camera Performance**: Photo/video quality, features, low-light performance
3. **Performance**: Gaming, multitasking, day-to-day usage
4. **Battery Life**: Usage time, charging speed, efficiency
5. **Value for Money**: Price-to-performance ratio, features per rupee
6. **Use Case Recommendations**: Best for gaming, photography, business, etc.

Format your response as a conversational analysis, highlighting key differences and providing clear recommendations for different user types.`;
  }

  /**
   * Phone extraction prompt template
   */
  static phoneExtraction(userMessage: string): string {
    return `Extract phone brand and model information from this user message.

User message: "${userMessage}"

Look for:
- Phone brands: Apple, Samsung, OnePlus, Xiaomi, Realme, Vivo, Oppo, Google, Nothing, Motorola, etc.
- Model names: iPhone 15, Galaxy S24, OnePlus 12, Mi 14, Realme GT, etc.
- Variants: Pro, Plus, Ultra, etc.

Common patterns:
- "iPhone 15 Pro" → brand: "Apple", model: "iPhone 15 Pro"
- "Samsung Galaxy S24" → brand: "Samsung", model: "Galaxy S24"
- "OnePlus 12" → brand: "OnePlus", model: "OnePlus 12"

Respond with JSON only:
{
  "brand": "Brand Name" or null,
  "model": "Full Model Name" or null,
  "variant": "Variant" or null
}

If no clear phone is mentioned, return all null values.`;
  }

  /**
   * Context-aware conversation prompt
   */
  static contextualResponse(userMessage: string, context: ChatContext): string {
    // Keep it simple and direct
    return `You are MobileMatrix AI, a helpful phone comparison assistant for Indian consumers.

User asked: "${userMessage}"

Instructions:
- Provide a helpful, specific response about phones
- Be conversational and natural
- Include specific phone models and prices in INR when relevant
- Give different responses for different questions
- If they ask about comparisons, provide detailed comparisons
- If they ask about recommendations, suggest specific phones with reasons
- If they mention budget, focus on phones in that price range
- If they ask about features (camera, battery, gaming), provide feature-specific advice

Respond naturally and conversationally. Do not use generic responses.`;
  }

  /**
   * Analyze user message for intent and content
   */
  private static analyzeUserMessage(message: string): {
    intent: string;
    brands: string[];
    models: string[];
    questionType: string;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Detect brands
    const brandPatterns = {
      'Apple': /\b(apple|iphone)\b/i,
      'Samsung': /\b(samsung|galaxy)\b/i,
      'OnePlus': /\b(oneplus|one plus)\b/i,
      'Xiaomi': /\b(xiaomi|mi|redmi)\b/i,
      'Realme': /\brealme\b/i,
      'Vivo': /\bvivo\b/i,
      'Oppo': /\boppo\b/i,
      'Google': /\b(google|pixel)\b/i,
      'Nothing': /\bnothing\b/i,
      'Motorola': /\b(motorola|moto)\b/i,
    };
    
    const brands = Object.keys(brandPatterns).filter(brand => 
      brandPatterns[brand as keyof typeof brandPatterns].test(message)
    );
    
    // Detect models
    const modelPatterns = [
      /iphone\s*\d+(\s*pro(\s*max)?)?/i,
      /galaxy\s*s\d+(\s*ultra)?/i,
      /oneplus\s*\d+[rt]?/i,
      /mi\s*\d+(\s*pro)?/i,
      /redmi\s*\w+(\s*pro)?/i,
      /realme\s*\w+(\s*pro)?/i,
      /pixel\s*\d+(\s*pro)?/i,
    ];
    
    const models = modelPatterns
      .map(pattern => message.match(pattern)?.[0])
      .filter(Boolean) as string[];
    
    // Detect intent
    let intent = 'general';
    if (/\b(compare|comparison|vs|versus|difference)\b/i.test(lowerMessage)) {
      intent = 'comparison';
    } else if (/\b(recommend|suggest|best|good)\b/i.test(lowerMessage)) {
      intent = 'recommendation';
    } else if (/\b(price|cost|budget)\b/i.test(lowerMessage)) {
      intent = 'pricing';
    } else if (/\b(camera|photo|video)\b/i.test(lowerMessage)) {
      intent = 'camera';
    } else if (/\b(battery|charging)\b/i.test(lowerMessage)) {
      intent = 'battery';
    } else if (/\b(performance|gaming|speed)\b/i.test(lowerMessage)) {
      intent = 'performance';
    } else if (brands.length > 0 || models.length > 0) {
      intent = 'phone_inquiry';
    }
    
    // Detect question type
    let questionType = 'statement';
    if (message.includes('?')) {
      questionType = 'question';
    } else if (/\b(tell me|show me|explain|how)\b/i.test(lowerMessage)) {
      questionType = 'information_request';
    } else if (/\b(help|assist|guide)\b/i.test(lowerMessage)) {
      questionType = 'help_request';
    }
    
    return { intent, brands, models, questionType };
  }

  /**
   * Get response strategy based on current step and message analysis
   */
  private static getResponseStrategy(step: string, analysis: any): string {
    if (analysis.intent === 'comparison' && analysis.brands.length >= 2) {
      return "User wants to compare specific phones. Provide detailed comparison focusing on key differences.";
    }
    
    if (analysis.intent === 'recommendation') {
      return "User wants recommendations. Ask about their budget, usage, and priorities, then suggest 2-3 specific models.";
    }
    
    if (analysis.intent === 'pricing') {
      return "User is asking about prices. Provide current Indian market prices and value-for-money analysis.";
    }
    
    if (analysis.brands.length > 0) {
      return `User mentioned ${analysis.brands.join(', ')}. Acknowledge these brands and help them narrow down to specific models.`;
    }
    
    switch (step) {
      case 'brand_selection':
        return "Help user select a phone brand. If they're unsure, suggest popular options based on their needs.";
      case 'model_selection':
        return "Help user select specific phone models. Provide popular options from their chosen brand.";
      case 'comparison':
        return "User is ready for comparison. Focus on detailed feature analysis and recommendations.";
      default:
        return "Provide helpful, specific guidance based on their exact question.";
    }
  }

  /**
   * Error recovery prompt template
   */
  static errorRecovery(error: string, context: ChatContext): string {
    return `The user encountered an error: "${error}"

Current context:
- Step: ${context.currentStep}
- Selected Brand: ${context.selectedBrand || 'None'}
- Selected Phones: ${context.selectedPhones.join(', ') || 'None'}

Provide a helpful recovery message that:
1. Acknowledges the issue politely
2. Offers alternative ways to proceed
3. Suggests specific actions the user can take
4. Maintains a positive, solution-focused tone

Keep the response brief and actionable.`;
  }
}