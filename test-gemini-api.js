// Simple script to test if your Gemini API key is working
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing Gemini API Configuration...');
  console.log(`API Key configured: ${apiKey ? 'Yes' : 'No'}`);
  console.log(`API Key length: ${apiKey ? apiKey.length : 0} characters`);
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🚀 Sending test request to Gemini API...');
    
    const result = await model.generateContent('Say "Hello, API is working!" in a friendly way.');
    const response = result.response.text();
    
    console.log('✅ API Test Successful!');
    console.log('📝 Response:', response);
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('🔑 Your API key appears to be invalid. Please check:');
      console.error('   1. The key is correct (no extra spaces/characters)');
      console.error('   2. The key has proper permissions');
      console.error('   3. You have API quota remaining');
    }
  }
}

testGeminiAPI();