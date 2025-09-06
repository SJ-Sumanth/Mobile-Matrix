import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Set up test database
  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 Setting up test database...');
    
    // Run database migrations for testing
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
      });
      
      // Seed test data
      execSync('npx prisma db seed', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
      });
      
      console.log('✅ Test database setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test database:', error);
      throw error;
    }
  }

  // Set up authentication state if needed
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Pre-warm the application
  try {
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application pre-warmed');
  } catch (error) {
    console.warn('⚠️ Could not pre-warm application:', error);
  }
  
  await browser.close();

  // Set up test environment variables
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-api-key';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  
  console.log('✅ Global setup complete');
}

export default globalSetup;