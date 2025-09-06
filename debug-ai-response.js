// Debug script to test AI responses directly
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testAIResponses() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    }
  });

  const testMessages = [
    "Hi Can you suggest me best mobiles under 50k. I want a all rounder phone",
    "Gaming phones with high refresh rate",
    "Best phones under ₹30,000",
    "Compare iPhone 15 vs Samsung Galaxy S24"
  ];

  console.log('🧪 Testing AI responses with different prompts...\n');

  for (const message of testMessages) {
    console.log(`📱 User Message: "${message}"`);
    
    // Test with simple prompt
    const simplePrompt = `You are a helpful phone comparison assistant for Indian consumers. 

User asked: "${message}"

Provide a helpful, specific response about phones. Be conversational and provide different responses for different questions. Include specific phone models, prices in INR, and relevant suggestions.`;

    try {
      const result = await model.generateContent(simplePrompt);
      const response = result.response.text();
      
      console.log(`🤖 AI Response: ${response.substring(0, 200)}...`);
      console.log(`📏 Response Length: ${response.length} characters`);
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error for message "${message}":`, error.message);
      console.log('---\n');
    }
  }
}

testAIResponses();