import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatContext, AIResponse } from '@/types/chat';

/**
 * Simple AI service that provides varied, contextual responses
 */
class SimpleAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log('✅ SimpleAI: Initializing with API key');
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1500,
        }
      });
    } else {
      console.log('⚠️ SimpleAI: No API key, using smart fallbacks');
    }
  }

  async processMessage(message: string, context?: ChatContext): Promise<AIResponse> {
    console.log('🔍 Processing message:', message);
    
    // Try AI first if available
    if (this.model) {
      try {
        const prompt = this.createDirectPrompt(message, context);
        console.log('🚀 Sending to AI:', prompt.substring(0, 100) + '...');
        
        const result = await this.model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('✅ AI Response:', response.substring(0, 100) + '...');
        
        return {
          message: response,
          suggestions: this.extractSuggestions(response),
          confidence: 0.9,
        };
      } catch (error) {
        console.error('❌ AI Error:', error);
        // Fall back to smart responses
      }
    }
    
    // Use smart fallback that provides varied responses
    return this.getSmartFallback(message, context);
  }

  private createDirectPrompt(message: string, context?: ChatContext): string {
    return `You are a helpful phone expert assistant for Indian consumers. 

User message: "${message}"

Instructions:
- Give specific, helpful answers about phones
- Include phone models and prices in ₹ (INR) when relevant
- Be conversational and friendly
- Provide different responses for different questions
- If comparing phones, give detailed comparisons
- If recommending phones, suggest specific models with reasons
- If asked about budget, focus on phones in that price range
- Always provide 3-4 follow-up suggestions

Respond naturally and helpfully with specific phone information.`;
  }

  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Look for bullet points
    const bulletMatches = response.match(/[•\-\*]\s*([^•\-\*\n]+)/g);
    if (bulletMatches) {
      suggestions.push(...bulletMatches.slice(0, 4).map(match => 
        match.replace(/[•\-\*]\s*/, '').trim()
      ));
    }
    
    // Look for questions
    const questionMatches = response.match(/([^.!?]*\?)/g);
    if (questionMatches && suggestions.length < 3) {
      suggestions.push(...questionMatches.slice(0, 2).map(q => q.trim()));
    }
    
    // Default suggestions if none found
    if (suggestions.length === 0) {
      return ['Tell me more', 'Compare options', 'Show alternatives', 'Check prices'];
    }
    
    return suggestions.slice(0, 4);
  }

  private getSmartFallback(message: string, context?: ChatContext): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    // Generate a unique response based on message content and timestamp
    const messageHash = this.hashMessage(message + Date.now().toString());
    
    // Phone comparison requests
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs')) {
      const phones = this.extractPhoneNames(message);
      if (phones.length >= 2) {
        return {
          message: `Great! Let me compare ${phones[0]} vs ${phones[1]} for you:\n\n**${phones[0]}** is known for its ${this.getPhoneStrength(phones[0])}, while **${phones[1]}** excels in ${this.getPhoneStrength(phones[1])}.\n\n**Key Differences:**\n• Performance: ${this.getPerformanceComparison(phones[0], phones[1])}\n• Camera: ${this.getCameraComparison(phones[0], phones[1])}\n• Price: ${this.getPriceComparison(phones[0], phones[1])}\n\nWhat specific aspect would you like me to dive deeper into?`,
          suggestions: ['Camera comparison', 'Performance details', 'Battery life', 'Price difference'],
          confidence: 0.9,
        };
      } else if (phones.length === 1) {
        return {
          message: `I see you want to compare ${phones[0]}! What other phone would you like to compare it with? Here are some popular alternatives in a similar range:\n\n• **Samsung Galaxy S24** - Great all-rounder\n• **iPhone 15** - Premium iOS experience\n• **OnePlus 12** - Performance focused\n• **Xiaomi 14** - Value for money\n\nJust tell me which one interests you!`,
          suggestions: ['Samsung Galaxy S24', 'iPhone 15', 'OnePlus 12', 'Xiaomi 14'],
          confidence: 0.8,
        };
      }
    }

    // Budget recommendations
    const budgetMatch = message.match(/(\d+(?:,\d+)*)/);
    if ((lowerMessage.includes('recommend') || lowerMessage.includes('best') || lowerMessage.includes('suggest')) && budgetMatch) {
      const budget = parseInt(budgetMatch[1].replace(/,/g, ''));
      return this.getBudgetRecommendation(budget, messageHash);
    }

    // Feature-specific questions
    if (lowerMessage.includes('camera')) {
      return this.getCameraRecommendation(messageHash);
    }

    if (lowerMessage.includes('gaming') || lowerMessage.includes('performance')) {
      return this.getGamingRecommendation(messageHash);
    }

    if (lowerMessage.includes('battery')) {
      return this.getBatteryRecommendation(messageHash);
    }

    // Brand-specific inquiries
    const brands = ['apple', 'samsung', 'oneplus', 'xiaomi', 'realme', 'vivo', 'oppo', 'google', 'nothing'];
    const mentionedBrand = brands.find(brand => lowerMessage.includes(brand));

    if (mentionedBrand) {
      return this.getBrandRecommendation(mentionedBrand, messageHash);
    }

    // Price inquiries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('₹')) {
      return this.getPriceInquiry(messageHash);
    }

    // Specific phone inquiries
    const phoneSelection = this.extractPhoneNames(message);
    if (phoneSelection.length > 0) {
      return this.getPhoneInquiry(phoneSelection[0], messageHash);
    }

    // Default contextual response
    return this.getDefaultResponse(context, messageHash);
  }

  private hashMessage(message: string): number {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getBudgetRecommendation(budget: number, hash: number): AIResponse {
    const responses = [
      {
        range: [0, 15000],
        messages: [
          `For ₹${budget.toLocaleString()}, here are some excellent budget options:\n\n• **Realme Narzo 60** (₹14,999) - Great performance for the price\n• **Redmi Note 13** (₹13,999) - Solid camera and battery\n• **Samsung Galaxy M14** (₹12,999) - Reliable brand with good support\n• **Poco M6 Pro** (₹11,999) - Gaming focused budget phone\n\nWhich aspect matters most to you?`,
          `With a budget of ₹${budget.toLocaleString()}, you can get some really good phones:\n\n• **Redmi 13C** (₹9,999) - Best value for basic use\n• **Realme C55** (₹12,999) - Good camera for the price\n• **Samsung Galaxy A15** (₹14,999) - Premium feel on budget\n• **Poco C65** (₹8,999) - Gaming on a tight budget\n\nWhat do you primarily use your phone for?`
        ]
      },
      {
        range: [15000, 30000],
        messages: [
          `₹${budget.toLocaleString()} is a sweet spot for mid-range phones! Here are my top picks:\n\n• **OnePlus Nord CE 3** (₹26,999) - Excellent performance and cameras\n• **Samsung Galaxy A54** (₹28,999) - Premium design with great display\n• **Realme GT Neo 5** (₹27,999) - Gaming powerhouse with fast charging\n• **Xiaomi 13 Lite** (₹25,999) - Lightweight with flagship features\n\nAny specific features you're looking for?`,
          `Great budget range! For ₹${budget.toLocaleString()}, consider these options:\n\n• **Nothing Phone 2a** (₹25,999) - Unique design with solid performance\n• **Realme 12 Pro** (₹24,999) - Excellent cameras and build quality\n• **Samsung Galaxy M54** (₹23,999) - Large battery with good performance\n• **OnePlus Nord 3** (₹29,999) - Flagship-level performance\n\nWhat's your primary use case?`
        ]
      },
      {
        range: [30000, 50000],
        messages: [
          `Excellent budget for premium phones! For ₹${budget.toLocaleString()}:\n\n• **OnePlus 12R** (₹39,999) - Flagship performance at great price\n• **Samsung Galaxy S23 FE** (₹44,999) - Premium Samsung experience\n• **iPhone 13** (₹49,900) - iOS ecosystem with great cameras\n• **Xiaomi 14** (₹54,999) - Latest flagship features\n\nLooking for any specific brand preference?`,
          `With ₹${budget.toLocaleString()}, you're in premium territory:\n\n• **Google Pixel 8a** (₹42,999) - Best computational photography\n• **OnePlus 11** (₹46,999) - Excellent performance and charging\n• **Samsung Galaxy S24** (₹74,999) - Latest flagship (on sale)\n• **Nothing Phone 2** (₹44,999) - Unique design with great specs\n\nWhat features are most important to you?`
        ]
      }
    ];

    const range = responses.find(r => budget >= r.range[0] && budget <= r.range[1]) || responses[responses.length - 1];
    const messageIndex = hash % range.messages.length;
    
    return {
      message: range.messages[messageIndex],
      suggestions: ['Camera quality', 'Gaming performance', 'Battery life', 'Brand preference'],
      confidence: 0.9,
    };
  }

  private getCameraRecommendation(hash: number): AIResponse {
    const messages = [
      `Looking for the best camera phones? Here are the current champions:\n\n• **iPhone 15 Pro** (₹1,34,900) - Exceptional video and computational photography\n• **Samsung Galaxy S24 Ultra** (₹1,29,999) - Versatile zoom and night mode\n• **Google Pixel 8 Pro** (₹1,06,999) - AI-powered photography magic\n• **OnePlus 12** (₹64,999) - Great portraits and natural colors\n\nWhat type of photography do you enjoy most?`,
      `Camera enthusiasts, here are your best options:\n\n• **Xiaomi 14 Ultra** (₹99,999) - Professional-grade camera system\n• **Vivo X100 Pro** (₹89,999) - Excellent portrait and night photography\n• **iPhone 15** (₹79,900) - Reliable and consistent results\n• **Samsung Galaxy S24+** (₹89,999) - AI-enhanced photography\n\nAre you more into portraits, landscapes, or video?`,
      `For photography lovers, these phones deliver amazing results:\n\n• **Google Pixel 8** (₹75,999) - Best computational photography\n• **OnePlus 11** (₹56,999) - Natural color reproduction\n• **Samsung Galaxy A54** (₹38,999) - Great mid-range camera\n• **Realme GT 6** (₹35,999) - Surprising camera quality for the price\n\nWhat's your photography style?`
    ];

    const messageIndex = hash % messages.length;
    
    return {
      message: messages[messageIndex],
      suggestions: ['Portrait mode', 'Night photography', 'Video recording', 'Zoom capabilities'],
      confidence: 0.9,
    };
  }

  private getGamingRecommendation(hash: number): AIResponse {
    const messages = [
      `Gaming performance champions! Here are the best phones for gaming:\n\n• **iPhone 15 Pro** (₹1,34,900) - A17 Pro chip dominates all games\n• **Samsung Galaxy S24** (₹74,999) - Snapdragon 8 Gen 3 with excellent cooling\n• **OnePlus 12** (₹64,999) - Gaming mode and high refresh rate\n• **Xiaomi 14** (₹54,999) - Flagship performance at great value\n\nWhat games do you play most?`,
      `For serious mobile gaming, consider these powerhouses:\n\n• **ASUS ROG Phone 8** (₹89,999) - Dedicated gaming phone with cooling\n• **RedMagic 9 Pro** (₹59,999) - Gaming-focused with shoulder triggers\n• **OnePlus 11** (₹56,999) - Excellent performance with good thermals\n• **Realme GT 6** (₹35,999) - Great gaming performance for the price\n\nDo you play competitive games or casual ones?`,
      `Gaming on mobile has never been better! Top picks:\n\n• **Samsung Galaxy S24 Ultra** (₹1,29,999) - Large screen with S Pen for strategy games\n• **iPhone 15 Pro Max** (₹1,59,900) - Best iOS gaming experience\n• **OnePlus 12R** (₹39,999) - Flagship gaming at mid-range price\n• **Poco F6** (₹29,999) - Budget gaming beast\n\nWhat's your favorite game genre?`
    ];

    const messageIndex = hash % messages.length;
    
    return {
      message: messages[messageIndex],
      suggestions: ['PUBG/COD Mobile', 'Genshin Impact', 'Casual gaming', 'Emulation'],
      confidence: 0.9,
    };
  }

  private getBatteryRecommendation(hash: number): AIResponse {
    const messages = [
      `Battery life champions! These phones will last all day:\n\n• **OnePlus 12** (₹64,999) - 5400mAh with 100W SuperVOOC charging\n• **Xiaomi 14 Ultra** (₹99,999) - 5300mAh with 90W fast charging\n• **Samsung Galaxy M55** (₹26,999) - 5000mAh with great optimization\n• **Realme GT 6** (₹35,999) - 5500mAh with 120W charging\n\nDo you need long battery life or super fast charging?`,
      `For all-day battery life, these are your best bets:\n\n• **iPhone 15 Plus** (₹89,900) - Excellent battery optimization\n• **Samsung Galaxy S24+** (₹89,999) - 4900mAh with intelligent power management\n• **OnePlus Nord 3** (₹33,999) - Great battery life in mid-range\n• **Redmi Note 13 Pro** (₹23,999) - 5100mAh with 67W charging\n\nWhat's more important - battery capacity or charging speed?`,
      `Never run out of juice with these battery beasts:\n\n• **Motorola Edge 50 Pro** (₹31,999) - 4500mAh with 125W TurboPower\n• **Vivo V30 Pro** (₹41,999) - 5000mAh with 80W FlashCharge\n• **Nothing Phone 2** (₹44,999) - 4700mAh with optimized software\n• **Poco X6 Pro** (₹26,999) - 5000mAh with 67W charging\n\nHow do you typically use your phone throughout the day?`
    ];

    const messageIndex = hash % messages.length;
    
    return {
      message: messages[messageIndex],
      suggestions: ['All-day battery', 'Fast charging', 'Wireless charging', 'Power efficiency'],
      confidence: 0.9,
    };
  }

  private getBrandRecommendation(brand: string, hash: number): AIResponse {
    const brandData: Record<string, { name: string; messages: string[] }> = {
      apple: {
        name: 'Apple',
        messages: [
          `Apple makes incredible iPhones! Current lineup:\n\n• **iPhone 15 Pro Max** (₹1,59,900) - Ultimate flagship with titanium build\n• **iPhone 15 Pro** (₹1,34,900) - Pro features in compact size\n• **iPhone 15** (₹79,900) - Great balance of features and price\n• **iPhone 14** (₹69,900) - Still excellent, now at better price\n\nWhat draws you to iPhone?`,
          `Apple's ecosystem is unmatched! Here are the current options:\n\n• **iPhone 15 Plus** (₹89,900) - Large screen with great battery\n• **iPhone 15** (₹79,900) - Perfect for most users\n• **iPhone 14 Plus** (₹69,900) - Big screen at lower price\n• **iPhone SE 3** (₹43,900) - Compact with flagship performance\n\nAre you already in the Apple ecosystem?`
        ]
      },
      samsung: {
        name: 'Samsung',
        messages: [
          `Samsung offers amazing variety! Popular models:\n\n• **Galaxy S24 Ultra** (₹1,29,999) - Ultimate Android flagship with S Pen\n• **Galaxy S24** (₹74,999) - Compact flagship with great cameras\n• **Galaxy A54** (₹38,999) - Premium mid-range experience\n• **Galaxy M54** (₹26,999) - Great value with large battery\n\nWhat Samsung features interest you most?`,
          `Samsung's Galaxy series has something for everyone:\n\n• **Galaxy S24+** (₹89,999) - Large screen flagship\n• **Galaxy A34** (₹30,999) - Solid mid-range option\n• **Galaxy M34** (₹18,999) - Budget-friendly with good specs\n• **Galaxy Z Flip 5** (₹99,999) - Foldable innovation\n\nLooking for flagship or mid-range?`
        ]
      },
      oneplus: {
        name: 'OnePlus',
        messages: [
          `OnePlus delivers flagship performance! Current lineup:\n\n• **OnePlus 12** (₹64,999) - Latest flagship with Snapdragon 8 Gen 3\n• **OnePlus 12R** (₹39,999) - Flagship performance at mid-range price\n• **OnePlus Nord 3** (₹33,999) - Excellent mid-range option\n• **OnePlus Nord CE 3** (₹26,999) - Budget-friendly with good features\n\nWhat attracts you to OnePlus?`,
          `OnePlus focuses on speed and performance:\n\n• **OnePlus 11** (₹56,999) - Previous flagship, still excellent\n• **OnePlus Nord 4** (₹29,999) - Latest mid-range with great build\n• **OnePlus Nord CE 4** (₹24,999) - Value-focused option\n• **OnePlus Open** (₹1,39,999) - Premium foldable\n\nLooking for flagship or mid-range performance?`
        ]
      }
    };

    const data = brandData[brand] || { name: brand.charAt(0).toUpperCase() + brand.slice(1), messages: [`${brand.charAt(0).toUpperCase() + brand.slice(1)} makes great phones! What specific model are you interested in?`] };
    const messageIndex = hash % data.messages.length;
    
    return {
      message: data.messages[messageIndex],
      suggestions: [`Latest ${data.name}`, `Budget ${data.name}`, `${data.name} flagships`, 'Compare brands'],
      confidence: 0.9,
    };
  }

  private getPriceInquiry(hash: number): AIResponse {
    const messages = [
      `Current phone pricing in India:\n\n**Flagship Tier (₹70,000+)**\n• iPhone 15 Pro - ₹1,34,900\n• Samsung S24 Ultra - ₹1,29,999\n• OnePlus 12 - ₹64,999\n\n**Mid-Range (₹25,000-₹70,000)**\n• OnePlus Nord 3 - ₹33,999\n• Samsung A54 - ₹38,999\n• Realme GT 6 - ₹35,999\n\nWhich price range interests you?`,
      `Here's a price breakdown of popular phones:\n\n**Premium (₹50,000+)**\n• iPhone 15 - ₹79,900\n• Samsung S24 - ₹74,999\n• Xiaomi 14 - ₹54,999\n\n**Mid-Range (₹20,000-₹50,000)**\n• OnePlus 12R - ₹39,999\n• Nothing Phone 2 - ₹44,999\n• Realme 12 Pro - ₹24,999\n\nWhat's your budget range?`,
      `Phone prices vary widely based on features:\n\n**Budget (Under ₹25,000)**\n• Redmi Note 13 - ₹16,999\n• Realme Narzo 60 - ₹17,999\n• Samsung M34 - ₹18,999\n\n**Premium Mid-Range (₹25,000-₹50,000)**\n• OnePlus Nord 4 - ₹29,999\n• Samsung A55 - ₹39,999\n• Vivo V30 - ₹33,999\n\nWhat features matter most to you?`
    ];

    const messageIndex = hash % messages.length;
    
    return {
      message: messages[messageIndex],
      suggestions: ['Under ₹25,000', '₹25,000-₹50,000', '₹50,000+', 'Best value phones'],
      confidence: 0.9,
    };
  }

  private getPhoneInquiry(phone: string, hash: number): AIResponse {
    const responses = [
      `Great choice! The ${phone} is a solid option. Here's what makes it special:\n\n• **Performance**: Excellent for daily tasks and gaming\n• **Camera**: Takes great photos in various conditions\n• **Battery**: All-day usage with fast charging\n• **Build**: Premium design and materials\n\nWould you like to compare it with similar phones or know more about specific features?`,
      `The ${phone} is quite popular! Here's why people love it:\n\n• **Value**: Great features for the price point\n• **Reliability**: Consistent performance and updates\n• **Camera**: Impressive photo and video quality\n• **Design**: Modern and attractive appearance\n\nWhat specific aspect interests you most about this phone?`,
      `Excellent pick! The ${phone} offers:\n\n• **Display**: Vibrant colors and smooth scrolling\n• **Performance**: Handles multitasking effortlessly\n• **Software**: Clean interface with useful features\n• **Support**: Good after-sales service and updates\n\nWant to see how it compares to other phones in its category?`
    ];

    const messageIndex = hash % responses.length;
    
    return {
      message: responses[messageIndex],
      suggestions: ['Compare similar phones', 'Check specifications', 'See current price', 'Read reviews'],
      confidence: 0.8,
    };
  }

  private getDefaultResponse(context?: ChatContext, hash?: number): AIResponse {
    const responses = [
      `Hi there! I'm here to help you find the perfect phone. I can assist with:\n\n• **Phone comparisons** - Compare any two phones side by side\n• **Recommendations** - Find phones based on your budget and needs\n• **Specifications** - Get detailed info about any phone\n• **Pricing** - Current market prices and best deals\n\nWhat would you like to explore today?`,
      `Welcome to your phone comparison journey! I can help you with:\n\n• **Brand exploration** - Discover phones from Apple, Samsung, OnePlus, and more\n• **Feature analysis** - Camera, battery, performance comparisons\n• **Budget planning** - Find the best phones in your price range\n• **Latest releases** - Stay updated with newest models\n\nHow can I assist you today?`,
      `Hello! Ready to find your next phone? I specialize in:\n\n• **Smart recommendations** - Phones tailored to your usage\n• **Detailed comparisons** - Side-by-side feature analysis\n• **Price tracking** - Best deals and offers\n• **Expert insights** - Pros and cons of different models\n\nWhat phone-related question can I answer for you?`
    ];

    const messageIndex = hash ? hash % responses.length : 0;
    
    return {
      message: responses[messageIndex],
      suggestions: ['Compare phones', 'Get recommendations', 'Check prices', 'Latest phones'],
      confidence: 0.8,
    };
  }

  private extractPhoneNames(message: string): string[] {
    const phonePatterns = [
      /iphone\s*\d+(\s*pro(\s*max)?)?/gi,
      /galaxy\s*s\d+(\s*ultra|\s*plus)?/gi,
      /oneplus\s*\d+[rt]?/gi,
      /pixel\s*\d+(\s*pro)?/gi,
      /xiaomi\s*\d+(\s*pro)?/gi,
      /redmi\s*\w+(\s*pro)?/gi,
      /realme\s*\w+(\s*pro)?/gi,
      /nothing\s*phone\s*\d*/gi,
      /vivo\s*\w+(\s*pro)?/gi,
      /oppo\s*\w+(\s*pro)?/gi,
    ];

    const phones: string[] = [];
    phonePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        phones.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(phones)]; // Remove duplicates
  }

  private getPhoneStrength(phone: string): string {
    const lowerPhone = phone.toLowerCase();
    if (lowerPhone.includes('iphone')) return 'iOS ecosystem and premium build quality';
    if (lowerPhone.includes('samsung')) return 'versatile cameras and brilliant displays';
    if (lowerPhone.includes('oneplus')) return 'fast performance and rapid charging';
    if (lowerPhone.includes('pixel')) return 'computational photography and clean Android';
    if (lowerPhone.includes('xiaomi')) return 'flagship features at competitive prices';
    if (lowerPhone.includes('realme')) return 'gaming performance and fast charging';
    if (lowerPhone.includes('nothing')) return 'unique design and clean software';
    return 'balanced performance and good value';
  }

  private getPerformanceComparison(phone1: string, phone2: string): string {
    return `${phone1} offers excellent day-to-day performance, while ${phone2} excels in intensive tasks`;
  }

  private getCameraComparison(phone1: string, phone2: string): string {
    return `${phone1} focuses on natural colors, ${phone2} emphasizes computational photography`;
  }

  private getPriceComparison(phone1: string, phone2: string): string {
    return `${phone1} offers premium features, ${phone2} provides better value for money`;
  }
}

// Export singleton instance
export const simpleAI = new SimpleAIService();