import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '../../../../services/ai.js';

/**
 * GET /api/debug/ai - Debug AI service configuration
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGeminiKey: !!apiKey,
        keyLength: apiKey ? apiKey.length : 0,
        keyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'Not configured',
      },
      aiService: {
        initialized: !!aiService.instance,
      }
    };

    // Test a simple AI request
    try {
      const testContext = {
        sessionId: 'debug-test',
        conversationHistory: [],
        currentStep: 'brand_selection' as const,
        selectedPhones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testResponse = await aiService.instance.processUserMessage(
        'Test message: iPhone 15 vs Samsung Galaxy S24', 
        testContext
      );

      debugInfo.testResponse = {
        success: true,
        messageLength: testResponse.message.length,
        messagePreview: testResponse.message.substring(0, 100) + '...',
        hasSuggestions: !!testResponse.suggestions && testResponse.suggestions.length > 0,
        confidence: testResponse.confidence,
      };
    } catch (error) {
      debugInfo.testResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}