import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GET /api/test-ai - Direct test of AI without any caching or complex logic
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const message = searchParams.get('message') || 'Test message';
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not configured',
        message: 'Please add GEMINI_API_KEY to your .env file'
      }, { status: 500 });
    }

    // Direct AI call without any complex logic
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const prompt = `You are a helpful phone comparison assistant for Indian consumers.

User asked: "${message}"

Provide a helpful, specific response about phones. Be conversational and include specific phone models and prices in INR when relevant. Give different responses for different questions.`;

    console.log('🔍 Direct AI Test - User Message:', message);
    console.log('🔍 Direct AI Test - Prompt:', prompt.substring(0, 200) + '...');

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('🤖 Direct AI Test - Response:', response.substring(0, 200) + '...');

    return NextResponse.json({
      success: true,
      userMessage: message,
      aiResponse: response,
      responseLength: response.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Direct AI test error:', error);
    return NextResponse.json({
      error: 'AI test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}